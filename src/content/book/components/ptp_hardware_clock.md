---
title: "PTP Hardware Clock — ptp_hardware_clock.sv"
description: "80-bit IEEE 1588 PHC with sub-nanosecond fractional accumulation and drift adjustment in PPB."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/ptp_hardware_clock.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ptp_hardware_clock.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/ptp_hardware_clock.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# PTP Hardware Clock — ptp_hardware_clock.sv

**Filename:** `timing/ptp_hardware_clock.sv`

## Description

Implements an 80-bit PTP hardware clock (PHC) with seconds/nanoseconds representation, frequency adjustment, discipline correction, and optional sub-nanosecond tracking hooks.

## Integration Points

- Core timestamp authority used by timestamping and synchronization modules
- Receives discipline/frequency corrections from OCXO control and host registers
- Feeds consistent PHC time into Ethernet TX/RX timestamp capture logic

## Verilog Source

```verilog
module ptp_hardware_clock #(
    parameter PHC_WIDTH = 80,
    parameter CLK_FREQ_HZ = 250_000_000
)(
    input  wire clk,
    input  wire rst_n,
    input  wire clk_1ghz,
    output wire [PHC_WIDTH-1:0] phc_timestamp,
    output wire [47:0] phc_seconds,
    output wire [31:0] phc_nanoseconds,
    input  wire signed [31:0] freq_adj_ppb,
    input  wire freq_adj_valid
);
// PTP Hardware Clock Module
// 80-bit TAI timestamp counter with frequency adjustment
// Format: 48-bit seconds + 32-bit nanoseconds

module ptp_hardware_clock #(
    parameter PHC_WIDTH = 80,
    parameter CLK_FREQ_HZ = 250_000_000  // 250MHz PHC clock
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // 1GHz sub-nanosecond clock (optional, for <1ns resolution)
    input  wire                     clk_1ghz,
    
    // PHC timestamp output
    output wire [PHC_WIDTH-1:0]     phc_timestamp,
    output wire [47:0]              phc_seconds,
    output wire [31:0]              phc_nanoseconds,
    
    // Adjustment interface
    input  wire [47:0]              adj_seconds,
    input  wire [31:0]              adj_nanoseconds,
    input  wire                     adj_add,        // 1=add, 0=subtract
    input  wire                     adj_trigger,    // Single-cycle pulse
    
    // Frequency adjustment (parts per billion)
    input  wire signed [31:0]       freq_adj_ppb,
    input  wire                     freq_adj_valid,
    
    // Discipline feedback from PI loop
    input  wire signed [31:0]       discipline_ns,
    input  wire                     discipline_valid,
    
    // GPS time set
    input  wire [47:0]              gps_utc_seconds,
    input  wire                     gps_time_set
);

    // PHC counter registers
    reg [47:0] seconds;
    reg [31:0] nanoseconds;
    reg [3:0] sub_nanoseconds;  // 0-9 cycles @ 1GHz (0.1ns resolution)
    
    // Frequency adjustment accumulator
    reg signed [63:0] freq_adj_accum;
    reg signed [31:0] freq_adj_ppb_reg;
    
    // Calculate nanosecond increment per clock cycle
    // At 250MHz, each cycle = 4ns nominally
    localparam NOMINAL_NS_PER_CYCLE = 4;
    localparam NS_PER_SEC = 1_000_000_000;
    
    // Fractional accumulator for sub-nanosecond precision
    // Q32.32 fixed-point accumulator
    reg [63:0] ns_frac_accum;
    localparam [63:0] NS_INCREMENT = 64'h0_0000_0004_0000_0000;  // 4.0 ns in Q32.32
    
    // Output assignments
    assign phc_seconds = seconds;
    assign phc_nanoseconds = nanoseconds;
    assign phc_timestamp = {seconds, nanoseconds};
    
    // Main counter logic
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            seconds <= 48'h0000_0000_0000;
            nanoseconds <= 32'h0000_0000;
            ns_frac_accum <= 64'h0;
            freq_adj_ppb_reg <= 32'h0000_0000;
            freq_adj_accum <= 64'h0;
        end else begin
            // Update frequency adjustment
            if (freq_adj_valid) begin
                freq_adj_ppb_reg <= freq_adj_ppb;
            end
            
            // Apply discipline correction
            if (discipline_valid) begin
                if (discipline_ns >= 0) begin
                    nanoseconds <= nanoseconds + discipline_ns[31:0];
                end else begin
                    nanoseconds <= nanoseconds - (-discipline_ns[31:0]);
                end
            end
            
            // GPS time set (overrides current time)
            if (gps_time_set) begin
                seconds <= gps_utc_seconds;
                nanoseconds <= 32'h0000_0000;
                ns_frac_accum <= 64'h0;
            end
            
            // Manual offset adjustment
            if (adj_trigger) begin
                if (adj_add) begin
                    nanoseconds <= nanoseconds + adj_nanoseconds;
                    seconds <= seconds + adj_seconds;
                end else begin
                    nanoseconds <= nanoseconds - adj_nanoseconds;
                    seconds <= seconds - adj_seconds;
                end
            end
            
            // Normal counter increment with frequency adjustment
            // Calculate adjusted increment based on PPB
            // freq_adj_ppb is in parts per billion
            // Adjusted increment = nominal + (nominal * ppb / 1e9)
            
            // Accumulate frequency adjustment
            // Scale: freq_adj_ppb is ppb, increment is in 0.01 ns units
            freq_adj_accum <= freq_adj_accum + {{32{freq_adj_ppb_reg[31]}}, freq_adj_ppb_reg};
            
            // Add nominal increment plus frequency adjustment
            ns_frac_accum <= ns_frac_accum + NS_INCREMENT;
            
            // Apply frequency adjustment when accumulator overflows
            // Each 1e9 accumulation = 1ns adjustment
            if (freq_adj_accum[63:32] != 0 || freq_adj_accum[31:0] >= NS_PER_SEC) begin
                if (freq_adj_accum >= 0) begin
                    ns_frac_accum <= ns_frac_accum + 64'h0_0000_0001_0000_0000;  // +1ns
                    freq_adj_accum <= freq_adj_accum - NS_PER_SEC;
                end else begin
                    ns_frac_accum <= ns_frac_accum - 64'h0_0000_0001_0000_0000;  // -1ns
                    freq_adj_accum <= freq_adj_accum + NS_PER_SEC;
                end
            end
            
            // Extract integer nanoseconds from fractional accumulator
            // Check for overflow on the new value being computed
            if (ns_frac_accum[63:32] >= NS_PER_SEC) begin
                nanoseconds <= ns_frac_accum[63:32] - NS_PER_SEC;
                seconds <= seconds + 1;
            end else begin
                nanoseconds <= ns_frac_accum[63:32];
            end
            
            // Handle underflow in offset adjustment
            if (adj_trigger && !adj_add && nanoseconds < adj_nanoseconds) begin
                nanoseconds <= nanoseconds + NS_PER_SEC - adj_nanoseconds;
                seconds <= seconds - 1 - adj_seconds;
            end
        end
    end
    
    // Optional sub-nanosecond counter at 1GHz
    // This provides 0.1ns resolution if clk_1ghz is available
    always @(posedge clk_1ghz or negedge rst_n) begin
        if (!rst_n) begin
            sub_nanoseconds <= 4'h0;
        end else begin
            if (sub_nanoseconds == 4'd9) begin
                sub_nanoseconds <= 4'h0;
            end else begin
                sub_nanoseconds <= sub_nanoseconds + 1;
            end
        end
    end

endmodule
endmodule
```
