---
title: "OCXO Discipline Loop — ocxo_discipline_loop.sv"
description: "Digital PI control loop disciplining the local OCXO against GPS 1PPS reference."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/ocxo_discipline_loop.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ocxo_discipline_loop.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/ocxo_discipline_loop.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# OCXO Discipline Loop — ocxo_discipline_loop.sv

**Filename:** `timing/ocxo_discipline_loop.sv`

## Description

Implements a PI-based discipline loop that steers OCXO output against GPS 1PPS timing, including lock acquisition, locked tracking, and holdover behavior.

## Integration Points

- Consumes PPS timestamping from GPS/PHC path to compute phase error
- Drives DAC control for OCXO frequency correction
- Produces discipline corrections and lock status consumed by PHC and host diagnostics

## Verilog Source

```verilog
module ocxo_discipline_loop #(
    parameter DAC_WIDTH = 16,
    parameter PHC_WIDTH = 80
)(
    input  wire clk,
    input  wire rst_n,
    input  wire pps_timestamp_valid,
    input  wire [PHC_WIDTH-1:0] pps_timestamp,
    input  wire gps_locked,
    input  wire [31:0] pi_kp,
    input  wire [31:0] pi_ki,
    output reg  [DAC_WIDTH-1:0] ocxo_dac,
    output reg discipline_locked
);
// OCXO Discipline Loop Module
// PI controller to discipline OCXO frequency to GPS 1PPS
// Phase-locked loop with holdover mode

module ocxo_discipline_loop #(
    parameter DAC_WIDTH = 16,
    parameter PHC_WIDTH = 80
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // GPS 1PPS and timestamp
    input  wire                         pps_timestamp_valid,
    input  wire [PHC_WIDTH-1:0]         pps_timestamp,
    input  wire                         gps_locked,
    
    // PI controller parameters (Q16.16 fixed-point)
    input  wire [31:0]                  pi_kp,
    input  wire [31:0]                  pi_ki,
    
    // OCXO DAC control output
    output reg  [DAC_WIDTH-1:0]         ocxo_dac,
    output reg                          ocxo_enable,
    
    // Discipline feedback to PHC
    output reg  signed [31:0]           discipline_ns,
    output reg                          discipline_valid,
    
    // Status outputs
    output reg                          discipline_locked,
    output reg  signed [31:0]           phase_error_ns,
    
    // Holdover configuration
    input  wire                         holdover_enable
);

    // Constants
    localparam NS_PER_SEC = 1_000_000_000;
    localparam DAC_CENTER = (1 << (DAC_WIDTH-1));  // Mid-point of DAC range
    localparam LOCK_THRESHOLD_NS = 100;            // Lock when error < 100ns
    localparam LOCK_COUNT_REQUIRED = 60;           // 60 consecutive seconds
    
    // Default PI gains (if not configured)
    localparam DEFAULT_KP = 32'h0000_0FA0;  // 0.000061 in Q16.16
    localparam DEFAULT_KI = 32'h0000_0107;  // 0.000004 in Q16.16
    
    // State machine
    typedef enum logic [2:0] {
        INIT,
        ACQUIRING,
        LOCKED,
        HOLDOVER
    } state_t;
    
    state_t state;
    
    // Expected 1PPS timestamp (increments by 1 second each PPS)
    reg [PHC_WIDTH-1:0] expected_pps_timestamp;
    reg pps_count_valid;
    
    // Phase error calculation
    reg signed [63:0] phase_error;
    reg signed [63:0] phase_error_filtered;
    
    // PI controller accumulators
    reg signed [63:0] proportional;
    reg signed [63:0] integral;
    reg signed [63:0] pi_output;
    
    // PI gain registers
    reg [31:0] kp_reg;
    reg [31:0] ki_reg;
    
    // Lock detection
    reg [7:0] lock_counter;
    
    // DAC output calculation with saturation
    wire signed [DAC_WIDTH:0] dac_output_calc_raw;
    reg [DAC_WIDTH-1:0] dac_output_calc;
    
    assign dac_output_calc_raw = DAC_CENTER + pi_output[DAC_WIDTH+15:16];
    
    // Saturate to valid DAC range
    always @(*) begin
        if (dac_output_calc_raw > ((1 << DAC_WIDTH) - 1)) begin
            dac_output_calc = (1 << DAC_WIDTH) - 1;
        end else if (dac_output_calc_raw < 0) begin
            dac_output_calc = 0;
        end else begin
            dac_output_calc = dac_output_calc_raw[DAC_WIDTH-1:0];
        end
    end
    
    // Main state machine and PI loop
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= INIT;
            expected_pps_timestamp <= {PHC_WIDTH{1'b0}};
            pps_count_valid <= 1'b0;
            phase_error <= 64'h0;
            phase_error_filtered <= 64'h0;
            proportional <= 64'h0;
            integral <= 64'h0;
            pi_output <= 64'h0;
            ocxo_dac <= DAC_CENTER;
            ocxo_enable <= 1'b1;
            discipline_ns <= 32'h0;
            discipline_valid <= 1'b0;
            discipline_locked <= 1'b0;
            phase_error_ns <= 32'h0;
            lock_counter <= 8'h00;
            kp_reg <= DEFAULT_KP;
            ki_reg <= DEFAULT_KI;
        end else begin
            // Default: clear single-cycle signals
            discipline_valid <= 1'b0;
            
            // Update PI gains
            if (pi_kp != 32'h0) kp_reg <= pi_kp;
            if (pi_ki != 32'h0) ki_reg <= pi_ki;
            
            case (state)
                INIT: begin
                    ocxo_enable <= 1'b1;
                    ocxo_dac <= DAC_CENTER;
                    integral <= 64'h0;
                    
                    if (gps_locked && pps_timestamp_valid) begin
                        // Initialize expected timestamp to first PPS
                        expected_pps_timestamp <= pps_timestamp;
                        pps_count_valid <= 1'b1;
                        state <= ACQUIRING;
                    end
                end
                
                ACQUIRING: begin
                    if (!gps_locked) begin
                        // Lost GPS lock - go to holdover
                        if (holdover_enable) begin
                            state <= HOLDOVER;
                        end else begin
                            state <= INIT;
                        end
                    end else if (pps_timestamp_valid) begin
                        // Calculate phase error
                        // Error = actual - expected (in nanoseconds)
                        expected_pps_timestamp <= expected_pps_timestamp + NS_PER_SEC;
                        
                        // Extract nanoseconds from timestamps for error calculation
                        phase_error <= $signed({1'b0, pps_timestamp[31:0]}) - 
                                      $signed({1'b0, expected_pps_timestamp[31:0]});
                        phase_error_ns <= phase_error[31:0];
                        
                        // Apply first-order low-pass filter to phase error
                        // Filtered = 0.875 * old + 0.125 * new
                        phase_error_filtered <= (phase_error_filtered * 7 + phase_error) >>> 3;
                        
                        // PI controller
                        // Proportional term: Kp * error
                        proportional <= ($signed(phase_error_filtered) * $signed({32'h0, kp_reg})) >>> 16;
                        
                        // Integral term: Ki * accumulated_error
                        integral <= integral + (($signed(phase_error_filtered) * $signed({32'h0, ki_reg})) >>> 16);
                        
                        // Limit integral windup
                        if (integral > 64'h0000_0000_7FFF_FFFF) begin
                            integral <= 64'h0000_0000_7FFF_FFFF;
                        end else if (integral < -64'h0000_0000_7FFF_FFFF) begin
                            integral <= -64'h0000_0000_7FFF_FFFF;
                        end
                        
                        // PI output = proportional + integral
                        pi_output <= proportional + integral;
                        
                        // Update DAC with saturated output
                        ocxo_dac <= dac_output_calc;
                        
                        // Send discipline correction to PHC
                        // Small corrections applied directly to PHC
                        if (phase_error[31:0] < 1000 && phase_error[31:0] > -1000) begin
                            discipline_ns <= phase_error[31:0];
                            discipline_valid <= 1'b1;
                        end
                        
                        // Check for lock
                        if ($signed(phase_error[31:0]) < LOCK_THRESHOLD_NS && 
                            $signed(phase_error[31:0]) > -LOCK_THRESHOLD_NS) begin
                            if (lock_counter < LOCK_COUNT_REQUIRED) begin
                                lock_counter <= lock_counter + 1;
                            end else begin
                                state <= LOCKED;
                                discipline_locked <= 1'b1;
                            end
                        end else begin
                            lock_counter <= 8'h00;
                        end
                    end
                end
                
                LOCKED: begin
                    if (!gps_locked) begin
                        // Lost GPS lock - go to holdover
                        discipline_locked <= 1'b0;
                        if (holdover_enable) begin
                            state <= HOLDOVER;
                        end else begin
                            state <= INIT;
                        end
                    end else if (pps_timestamp_valid) begin
                        // Continue tracking in locked state
                        expected_pps_timestamp <= expected_pps_timestamp + NS_PER_SEC;
                        
                        phase_error <= $signed({1'b0, pps_timestamp[31:0]}) - 
                                      $signed({1'b0, expected_pps_timestamp[31:0]});
                        phase_error_ns <= phase_error[31:0];
                        
                        // Narrower bandwidth PI loop in locked state
                        phase_error_filtered <= (phase_error_filtered * 15 + phase_error) >>> 4;
                        
                        proportional <= ($signed(phase_error_filtered) * $signed({32'h0, kp_reg})) >>> 16;
                        integral <= integral + (($signed(phase_error_filtered) * $signed({32'h0, ki_reg})) >>> 16);
                        
                        // Tighter integral limit in locked state
                        if (integral > 64'h0000_0000_3FFF_FFFF) begin
                            integral <= 64'h0000_0000_3FFF_FFFF;
                        end else if (integral < -64'h0000_0000_3FFF_FFFF) begin
                            integral <= -64'h0000_0000_3FFF_FFFF;
                        end
                        
                        pi_output <= proportional + integral;
                        
                        // Update DAC with saturated output
                        ocxo_dac <= dac_output_calc;
                        
                        // Apply fine discipline corrections
                        if (phase_error[31:0] < 500 && phase_error[31:0] > -500) begin
                            discipline_ns <= phase_error[31:0];
                            discipline_valid <= 1'b1;
                        end
                        
                        // Check if still locked
                        if ($signed(phase_error[31:0]) >= LOCK_THRESHOLD_NS || 
                            $signed(phase_error[31:0]) <= -LOCK_THRESHOLD_NS) begin
                            lock_counter <= lock_counter - 1;
                            if (lock_counter == 0) begin
                                state <= ACQUIRING;
                                discipline_locked <= 1'b0;
                            end
                        end else begin
                            if (lock_counter < LOCK_COUNT_REQUIRED) begin
                                lock_counter <= lock_counter + 1;
                            end
                        end
                    end
                end
                
                HOLDOVER: begin
                    // Freeze DAC output, maintain last frequency
                    // Don't update integral or proportional terms
                    
                    if (gps_locked) begin
                        // GPS signal restored
                        state <= ACQUIRING;
                        lock_counter <= 8'h00;
                    end
                end
                
                default: state <= INIT;
            endcase
        end
    end

endmodule
endmodule
```
