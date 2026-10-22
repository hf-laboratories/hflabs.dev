---
title: "CDC Modules — cdc_modules.v"
description: "Metastability-hardened clock domain crossing primitives including sync, pulse, and data handshakes."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/cdc_modules.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/cdc_modules.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/cdc_modules.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# CDC Modules — cdc_modules.v

**Filename:** `util/cdc_modules.v`

## Description

A set of clock domain crossing (CDC) primitives for safe signal and data transfer between asynchronous clock domains. Includes:

- `cdc_sync`: Multi-stage synchronizer for control signals
- `cdc_pulse_sync`: Reliable single-cycle pulse transfer
- `cdc_handshake`: Full handshake protocol for data transfer

## Integration Points

- Used at all clock domain boundaries for control, event, and data signals
- Instantiated in top-level and subsystem modules
- Testbench coverage for CDC scenarios

## Verilog Source

```verilog
// Clock Domain Crossing Synchronizer
// Provides safe synchronization of signals between clock domains

module cdc_sync #(
    parameter WIDTH = 1,
    parameter STAGES = 2  // Number of synchronizer stages (min 2)
)(
    input  wire                 dst_clk,
    input  wire                 dst_rst_n,
    input  wire [WIDTH-1:0]     src_data,
    output wire [WIDTH-1:0]     dst_data
);
    // Multi-stage synchronizer
    reg [WIDTH-1:0] sync_stages [0:STAGES-1];
    integer i;
    always @(posedge dst_clk or negedge dst_rst_n) begin
        if (!dst_rst_n) begin
            for (i = 0; i < STAGES; i = i + 1) begin
                sync_stages[i] <= {WIDTH{1'b0}};
            end
        end else begin
            sync_stages[0] <= src_data;
            for (i = 1; i < STAGES; i = i + 1) begin
                sync_stages[i] <= sync_stages[i-1];
            end
        end
    end
    assign dst_data = sync_stages[STAGES-1];
endmodule

// Clock Domain Crossing Pulse Synchronizer
// Safely transfers single-cycle pulses between clock domains
module cdc_pulse_sync (
    input  wire src_clk,
    input  wire src_rst_n,
    input  wire src_pulse,
    input  wire dst_clk,
    input  wire dst_rst_n,
    output wire dst_pulse
);
    reg src_toggle;
    reg [2:0] dst_sync;
    // Source domain: convert pulse to toggle
    always @(posedge src_clk or negedge src_rst_n) begin
        if (!src_rst_n) begin
            src_toggle <= 1'b0;
        end else if (src_pulse) begin
            src_toggle <= ~src_toggle;
        end
    end
    // Destination domain: synchronize and detect edge
    always @(posedge dst_clk or negedge dst_rst_n) begin
        if (!dst_rst_n) begin
            dst_sync <= 3'b000;
        end else begin
            dst_sync <= {dst_sync[1:0], src_toggle};
        end
    end
    // Generate pulse on toggle edge
    assign dst_pulse = dst_sync[2] ^ dst_sync[1];
endmodule

// Clock Domain Crossing Handshake
// Provides full handshake for data transfer between clock domains
module cdc_handshake #(
    parameter DATA_WIDTH = 32
)(
    // Source clock domain
    input  wire                     src_clk,
    input  wire                     src_rst_n,
    input  wire [DATA_WIDTH-1:0]    src_data,
    input  wire                     src_valid,
    output wire                     src_ready,
    // Destination clock domain
    input  wire                     dst_clk,
    input  wire                     dst_rst_n,
    output reg  [DATA_WIDTH-1:0]    dst_data,
    output wire                     dst_valid,
    input  wire                     dst_ready
);
    // Source domain registers
    reg [DATA_WIDTH-1:0] src_data_reg;
    reg src_req;
    wire src_ack;
    // Destination domain registers
    reg dst_req_sync1, dst_req_sync2, dst_req_sync3;
    reg dst_ack;
    // Source domain ACK synchronizer
    reg src_ack_sync1, src_ack_sync2;
    assign src_ack = src_ack_sync2;
    // Source domain logic
    always @(posedge src_clk or negedge src_rst_n) begin
        if (!src_rst_n) begin
            src_data_reg <= {DATA_WIDTH{1'b0}};
            src_req <= 1'b0;
            src_ack_sync1 <= 1'b0;
            src_ack_sync2 <= 1'b0;
        end else begin
            // Synchronize ACK
            src_ack_sync1 <= dst_ack;
            src_ack_sync2 <= src_ack_sync1;
            // Handle new data
            if (src_valid && src_ready) begin
                src_data_reg <= src_data;
                src_req <= 1'b1;
            end else if (src_req && src_ack) begin
                src_req <= 1'b0;
            end
        end
    end
    assign src_ready = !src_req || src_ack;
    // Destination domain logic
    always @(posedge dst_clk or negedge dst_rst_n) begin
        if (!dst_rst_n) begin
            dst_data <= {DATA_WIDTH{1'b0}};
            dst_req_sync1 <= 1'b0;
            dst_req_sync2 <= 1'b0;
            dst_req_sync3 <= 1'b0;
            dst_ack <= 1'b0;
        end else begin
            // Synchronize REQ
            dst_req_sync1 <= src_req;
            dst_req_sync2 <= dst_req_sync1;
            dst_req_sync3 <= dst_req_sync2;
            // Detect request edge
            if (dst_req_sync2 && !dst_req_sync3) begin
                dst_data <= src_data_reg;
                dst_ack <= 1'b1;
            end else if (dst_valid && dst_ready) begin
                dst_ack <= 1'b0;
            end
        end
    end
    assign dst_valid = dst_ack;
endmodule
```
