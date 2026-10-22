---
title: "IPU Exchange Buffer — ipu_exchange_buffer.v"
description: "Elastic ping-pong exchange buffer between IPU compute processing elements and DMA fabric."
part: "Part II — Component Library"
chapter: "IPU Interface Components"
category: "IPU Interface Components"
filename: "ipu/ipu_exchange_buffer.v"
order: 100
tags: ["IPU Interface Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ipu_exchange_buffer.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ipu/ipu_exchange_buffer.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# IPU Exchange Buffer — ipu_exchange_buffer.v

**Filename:** `ipu/ipu_exchange_buffer.v`

## Description

Single-entry ready/valid exchange buffer for IPU data handoff between producer/consumer pipeline stages.

## Integration Points

- Local buffering in IPU dataflow edges
- Can be inserted between tile router, gateway, or compute wrappers to decouple backpressure

## Verilog Source

```verilog
module ipu_exchange_buffer #(
    parameter DATA_WIDTH = 256
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     in_valid,
    input  wire [DATA_WIDTH-1:0]    in_data,
    output wire                     in_ready,
    output reg                      out_valid,
    output reg  [DATA_WIDTH-1:0]    out_data,
    input  wire                     out_ready
);
    assign in_ready = !out_valid || out_ready;
    // IPU Exchange Buffer
    // Single-entry buffer for IPU data exchange
    module ipu_exchange_buffer #(
        parameter DATA_WIDTH = 256
    )(
        input  wire                     clk,
        input  wire                     rst_n,
        input  wire                     in_valid,
        input  wire [DATA_WIDTH-1:0]    in_data,
        output wire                     in_ready,
        output reg                      out_valid,
        output reg  [DATA_WIDTH-1:0]    out_data,
        input  wire                     out_ready
    );
    
        assign in_ready = !out_valid || out_ready;
    
        always @(posedge clk or negedge rst_n) begin
            if (!rst_n) begin
                out_valid <= 1'b0;
                out_data <= {DATA_WIDTH{1'b0}};
            end else begin
                if (in_valid && in_ready) begin
                    out_valid <= 1'b1;
                    out_data <= in_data;
                end else if (out_valid && out_ready) begin
                    out_valid <= 1'b0;
                end
            end
        end
    endmodule
endmodule
```
