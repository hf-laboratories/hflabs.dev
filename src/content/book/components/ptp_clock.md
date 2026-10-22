---
title: "PTP Clock — ptp_clock.v"
description: "High-precision 96-bit timestamping clock with drift compensation and fractional nanosecond accumulation."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/ptp_clock.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ptp_clock.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/ptp_clock.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# PTP Clock — ptp_clock.v

**Filename:** `dma_engine/ptp_clock.v`

## Description

IEEE 1588-style high-precision timestamping clock for DMA operations, including time capture, sync adjustment, and drift compensation.

## Integration Points

- Timestamp source for DMA completion and telemetry correlation
- Optional sync input from external PTP grandmaster
- BAR-controlled time/frequency adjustment plane

## Verilog Source

```verilog
module ptp_clock #(
    parameter CLOCK_FREQ_HZ = 250_000_000,
    parameter TIMESTAMP_WIDTH = 96
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire                         capture_req,
    input  wire [31:0]                  capture_tag,
    output reg  [TIMESTAMP_WIDTH-1:0]   captured_timestamp,
    output reg                          capture_valid,
    output reg  [TIMESTAMP_WIDTH-1:0]   current_time,
    input  wire                         time_set_valid,
    input  wire [TIMESTAMP_WIDTH-1:0]   time_set_value
);
// PTP Clock Module (IEEE 1588)
// Provides high-precision timestamping for DMA operations and agent coordination
// Supports sub-microsecond accuracy with hardware timestamping
//
// Features:
// - 96-bit timestamp (48-bit seconds + 48-bit nanoseconds for extended range)
// - Hardware-assisted timestamp capture for DMA operations
// - PTP clock synchronization interface
// - Frequency adjustment for drift compensation
//
module ptp_clock #(
    parameter CLOCK_FREQ_HZ = 250_000_000,  // 250 MHz default
    parameter TIMESTAMP_WIDTH = 96           // 48-bit seconds + 48-bit nanoseconds
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // Time capture interface (for DMA completions)
    input  wire                         capture_req,
    input  wire [31:0]                  capture_tag,
    output reg  [TIMESTAMP_WIDTH-1:0]   captured_timestamp,
    output reg  [31:0]                  captured_tag,
    output reg                          capture_valid,
    
    // Current time output (free-running)
    output reg  [TIMESTAMP_WIDTH-1:0]   current_time,
    
    // BAR register interface for clock control
    input  wire                         time_set_valid,
    input  wire [TIMESTAMP_WIDTH-1:0]   time_set_value,
    input  wire                         freq_adj_valid,
    input  wire signed [31:0]           freq_adj_ppb,       // Parts per billion adjustment
    
    // PTP sync pulse (optional, from external PTP grandmaster)
    input  wire                         ptp_sync_pulse,
    input  wire [TIMESTAMP_WIDTH-1:0]   ptp_sync_time,
    input  wire                         ptp_sync_valid,
    
    // Status outputs
    output reg                          clock_locked,
    output reg  [31:0]                  sync_offset_ns,     // Offset from last sync
    output reg  [31:0]                  clock_drift_ppb,    // Measured drift
    
    // Statistics
    output reg  [31:0]                  sync_count,
    output reg  [31:0]                  captures_count
);

    // Internal time representation
    reg [47:0] seconds;           // 48-bit seconds (enough for billions of years)
    reg [47:0] nanoseconds;       // 48-bit nanoseconds (with fractional extension)
    
    // Nanosecond increment per clock cycle calculation
    // Formula: ns_per_cycle = 1e9 / clock_freq_hz
    // For 250 MHz: 1e9 / 250e6 = 4 ns per cycle
    //
    // To maintain sub-nanosecond precision, we use fixed-point arithmetic:
    // The fractional nanosecond is stored in the upper 32 bits of a 64-bit accumulator.
    // Each cycle, we add (1e9 << 32) / CLOCK_FREQ_HZ to the accumulator.
    // When the upper 32 bits exceed 0, we add that many nanoseconds to the clock.
    //
    // Example at 250 MHz:
    //   NS_PER_CYCLE_FP = (1,000,000,000 << 32) / 250,000,000 = 17,179,869,184
    //   This represents exactly 4.0 nanoseconds in 32.32 fixed-point format.
    localparam [63:0] NS_PER_CYCLE_FP = (64'd1_000_000_000 << 32) / CLOCK_FREQ_HZ;
    
    // Fractional nanosecond accumulator (for sub-nanosecond precision)
    reg [63:0] ns_accumulator;
    
    // Frequency adjustment (signed, applied to increment)
    reg signed [63:0] ns_increment_adjusted;
    reg signed [31:0] current_freq_adj_ppb;
    
    // One billion for nanosecond rollover
    localparam [47:0] ONE_BILLION = 48'd1_000_000_000;
    
    // Capture FIFO (simple single-entry for now)
    reg capture_pending;
    reg [TIMESTAMP_WIDTH-1:0] pending_timestamp;
    reg [31:0] pending_tag;
    
    // Sync state machine
    localparam SYNC_IDLE = 2'd0;
    localparam SYNC_WAIT = 2'd1;
    localparam SYNC_ADJUST = 2'd2;
    
    reg [1:0] sync_state;
    reg [TIMESTAMP_WIDTH-1:0] last_sync_time;
    reg [31:0] cycles_since_sync;
    
    // Calculate adjusted increment based on PPB offset
    always @(*) begin
        // Base increment in fixed-point
        // Adjustment: increment * (1 + ppb/1e9) = increment + increment*ppb/1e9
        // Since ppb can be +/- 1M, and increment is ~4ns, adjustment is ~0.004 ns max
        ns_increment_adjusted = $signed(NS_PER_CYCLE_FP) + 
                               ($signed(NS_PER_CYCLE_FP) * $signed(current_freq_adj_ppb)) / 1_000_000_000;
    end
    
    // Main clock counter
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            seconds <= 48'd0;
            nanoseconds <= 48'd0;
            ns_accumulator <= 64'd0;
            current_time <= {TIMESTAMP_WIDTH{1'b0}};
            current_freq_adj_ppb <= 32'd0;
            
            capture_valid <= 1'b0;
            captured_timestamp <= {TIMESTAMP_WIDTH{1'b0}};
            captured_tag <= 32'd0;
            capture_pending <= 1'b0;
            pending_timestamp <= {TIMESTAMP_WIDTH{1'b0}};
            pending_tag <= 32'd0;
            
            clock_locked <= 1'b0;
            sync_offset_ns <= 32'd0;
            clock_drift_ppb <= 32'd0;
            sync_count <= 32'd0;
            captures_count <= 32'd0;
            
            sync_state <= SYNC_IDLE;
            last_sync_time <= {TIMESTAMP_WIDTH{1'b0}};
            cycles_since_sync <= 32'd0;
            
        end else begin
            // Clear capture valid after one cycle
            capture_valid <= 1'b0;
            
            // Output pending capture if any
            if (capture_pending) begin
                captured_timestamp <= pending_timestamp;
                captured_tag <= pending_tag;
                capture_valid <= 1'b1;
                capture_pending <= 1'b0;
                captures_count <= captures_count + 1;
            end
            
            // Time set (from BAR write)
            if (time_set_valid) begin
                seconds <= time_set_value[TIMESTAMP_WIDTH-1:48];
                nanoseconds <= time_set_value[47:0];
                ns_accumulator <= 64'd0;
            end
            
            // Frequency adjustment (from BAR write)
            if (freq_adj_valid) begin
                current_freq_adj_ppb <= freq_adj_ppb;
            end
            
            // Normal time increment
            if (!time_set_valid) begin
                ns_accumulator <= ns_accumulator + ns_increment_adjusted;
                
                // Extract whole nanoseconds from accumulator
                if (ns_accumulator[63:32] > 0) begin
                    nanoseconds <= nanoseconds + ns_accumulator[63:32];
                    ns_accumulator[63:32] <= 32'd0;
                end
                
                // Handle nanosecond rollover
                if (nanoseconds >= ONE_BILLION) begin
                    nanoseconds <= nanoseconds - ONE_BILLION;
                    seconds <= seconds + 1;
                end
            end
            
            // Update current time output
            current_time <= {seconds, nanoseconds[47:0]};
            
            // Timestamp capture (on request)
            if (capture_req && !capture_pending) begin
                pending_timestamp <= {seconds, nanoseconds[47:0]};
                pending_tag <= capture_tag;
                capture_pending <= 1'b1;
            end
            
            // PTP synchronization
            cycles_since_sync <= cycles_since_sync + 1;
            
            case (sync_state)
                SYNC_IDLE: begin
                    if (ptp_sync_valid) begin
                        sync_state <= SYNC_ADJUST;
                        last_sync_time <= ptp_sync_time;
                        
                        // Calculate offset from received time
                        if ({seconds, nanoseconds[47:0]} > ptp_sync_time) begin
                            sync_offset_ns <= ({seconds, nanoseconds[47:0]} - ptp_sync_time);
                        end else begin
                            sync_offset_ns <= (ptp_sync_time - {seconds, nanoseconds[47:0]});
                        end
                    end
                end
                
                SYNC_ADJUST: begin
                    // Apply time correction
                    seconds <= ptp_sync_time[TIMESTAMP_WIDTH-1:48];
                    nanoseconds <= ptp_sync_time[47:0];
                    ns_accumulator <= 64'd0;
                    
                    // Calculate drift in PPB based on offset and time since last sync
                    if (cycles_since_sync > 0 && sync_offset_ns > 0) begin
                        // drift_ppb = (offset_ns * 1e9) / (cycles * ns_per_cycle)
                        clock_drift_ppb <= (sync_offset_ns * 1_000_000_000) / 
                                          (cycles_since_sync * (1_000_000_000 / CLOCK_FREQ_HZ));
                    end
                    
                    sync_count <= sync_count + 1;
                    cycles_since_sync <= 32'd0;
                    clock_locked <= 1'b1;
                    sync_state <= SYNC_IDLE;
                end
                
                default: sync_state <= SYNC_IDLE;
            endcase
            
            // Lose lock if too long without sync (10 seconds at 250 MHz)
            if (cycles_since_sync > 32'd2_500_000_000) begin
                clock_locked <= 1'b0;
            end
        end
    end

endmodule
endmodule
```
