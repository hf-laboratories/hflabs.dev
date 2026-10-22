---
title: "IPU Sync Controller — ipu_sync_controller.v"
description: "Hardware barrier synchronization engine coordinating global BSP (Bulk Synchronous Parallel) phases."
part: "Part II — Component Library"
chapter: "IPU Interface Components"
category: "IPU Interface Components"
filename: "ipu/ipu_sync_controller.v"
order: 100
tags: ["IPU Interface Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ipu_sync_controller.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ipu/ipu_sync_controller.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# IPU Sync Controller — ipu_sync_controller.v

**Filename:** `ipu/ipu_sync_controller.v`

## Description

Generates synchronization acknowledgements and sync pulses for coordinating IPU tile phases.

## Integration Points

- Synchronization barrier/pulse source for tile-level orchestration
- Can be triggered by host/firmware sequencing or internal control FSMs

## Verilog Source

```verilog
module ipu_sync_controller #(
    parameter COUNTER_WIDTH = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     sync_request,
    output reg                      sync_ack,
    output reg                      sync_pulse,
    output reg  [COUNTER_WIDTH-1:0] sync_counter
);
// IPU Sync Controller
// Provides a simple synchronization pulse generator for IPU tiles
module ipu_sync_controller #(
    parameter COUNTER_WIDTH = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     sync_request,
    output reg                      sync_ack,
    output reg                      sync_pulse,
    output reg  [COUNTER_WIDTH-1:0] sync_counter
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            sync_ack <= 1'b0;
            sync_pulse <= 1'b0;
            sync_counter <= {COUNTER_WIDTH{1'b0}};
        end else begin
            sync_ack <= 1'b0;
            sync_pulse <= 1'b0;

            if (sync_request) begin
                sync_ack <= 1'b1;
                sync_pulse <= 1'b1;
                sync_counter <= sync_counter + 1'b1;
            end
        end
    end
endmodule
endmodule
```
