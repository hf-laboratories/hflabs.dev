---
title: "GPUDirect Interface — gpudirect_interface.v"
description: "NVIDIA GPUDirect RDMA compliant handshake controller for direct GPU VRAM access."
part: "Part II — Component Library"
chapter: "P2P Communication Components"
category: "P2P Communication Components"
filename: "p2p/gpudirect_interface.v"
order: 100
tags: ["P2P Communication Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/gpudirect_interface.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/p2p/gpudirect_interface.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# GPUDirect Interface — gpudirect_interface.v

**Filename:** `p2p/gpudirect_interface.v`

## Description

Implements a minimal GPUDirect RDMA handshake endpoint for GPU-to-FPGA request initiation and completion signaling.

## Integration Points

- Entry point for GPU-originated RDMA operations
- Exposes request capture metadata for downstream P2P/DMA orchestration

## Verilog Source

```verilog
module gpudirect_interface #(
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     rdma_req_valid,
    output wire                     rdma_req_ready,
    input  wire [ADDR_WIDTH-1:0]    rdma_addr,
    input  wire [31:0]              rdma_length,
    input  wire [15:0]              rdma_context,
    output reg                      rdma_active,
    output reg                      rdma_done,
    output reg  [31:0]              rdma_status
);
// GPUDirect RDMA Interface
// Provides a minimal handshake for GPU-to-FPGA RDMA operations
module gpudirect_interface #(
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     rdma_req_valid,
    output wire                     rdma_req_ready,
    input  wire [ADDR_WIDTH-1:0]    rdma_addr,
    input  wire [31:0]              rdma_length,
    input  wire [15:0]              rdma_context,
    output reg                      rdma_active,
    output reg                      rdma_done,
    output reg  [31:0]              rdma_status,
    output reg  [ADDR_WIDTH-1:0]    last_addr,
    output reg  [31:0]              last_length,
    output reg  [15:0]              last_context
);

    assign rdma_req_ready = !rdma_active;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            rdma_active <= 1'b0;
            rdma_done <= 1'b0;
            rdma_status <= 32'd0;
            last_addr <= {ADDR_WIDTH{1'b0}};
            last_length <= 32'd0;
            last_context <= 16'd0;
        end else begin
            rdma_done <= 1'b0;

            if (rdma_req_valid && rdma_req_ready) begin
                rdma_active <= 1'b1;
                last_addr <= rdma_addr;
                last_length <= rdma_length;
                last_context <= rdma_context;
                rdma_status <= 32'd0;
            end else if (rdma_active) begin
                rdma_active <= 1'b0;
                rdma_done <= 1'b1;
            end
        end
    end
endmodule
endmodule
```
