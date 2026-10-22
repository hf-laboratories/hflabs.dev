---
title: "IPU Gateway Shim — ipu_gateway_shim.v"
description: "Hardware shim translating Graphcore IPU streaming format into standard PCIe P2P transactions."
part: "Part II — Component Library"
chapter: "P2P Communication Components"
category: "P2P Communication Components"
filename: "p2p/ipu_gateway_shim.v"
order: 100
tags: ["P2P Communication Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ipu_gateway_shim.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/p2p/ipu_gateway_shim.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# IPU Gateway Shim — ipu_gateway_shim.v

**Filename:** `p2p/ipu_gateway_shim.v`

## Description

Bridges IPU transfer requests into the P2P DMA request fabric and returns lightweight response status.

## Integration Points

- Adapter between IPU-side request semantics and DMA request channels
- Used where IPU command producers need access to shared P2P DMA path

## Verilog Source

```verilog
module ipu_gateway_shim #(
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     ipu_req_valid,
    input  wire [ADDR_WIDTH-1:0]    ipu_req_addr,
    input  wire [31:0]              ipu_req_length,
    input  wire [7:0]               ipu_req_tag,
    output wire                     ipu_req_ready,
    output reg                      ipu_rsp_valid,
    output reg  [31:0]              ipu_rsp_status,
    output reg                      dma_req_valid,
    output reg  [ADDR_WIDTH-1:0]    dma_req_addr,
    output reg  [31:0]              dma_req_length,
    output reg  [7:0]               dma_req_tag,
    input  wire                     dma_req_ready
);
// IPU Gateway Shim
// Bridges IPU transfer requests into the P2P DMA fabric
module ipu_gateway_shim #(
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     ipu_req_valid,
    input  wire [ADDR_WIDTH-1:0]    ipu_req_addr,
    input  wire [31:0]              ipu_req_length,
    input  wire [7:0]               ipu_req_tag,
    output wire                     ipu_req_ready,
    output reg                      ipu_rsp_valid,
    output reg  [31:0]              ipu_rsp_status,
    output reg                      dma_req_valid,
    output reg  [ADDR_WIDTH-1:0]    dma_req_addr,
    output reg  [31:0]              dma_req_length,
    output reg  [7:0]               dma_req_tag,
    input  wire                     dma_req_ready
);

    assign ipu_req_ready = !dma_req_valid || dma_req_ready;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            dma_req_valid <= 1'b0;
            dma_req_addr <= {ADDR_WIDTH{1'b0}};
            dma_req_length <= 32'd0;
            dma_req_tag <= 8'd0;
            ipu_rsp_valid <= 1'b0;
            ipu_rsp_status <= 32'd0;
        end else begin
            ipu_rsp_valid <= 1'b0;

            if (ipu_req_valid && ipu_req_ready) begin
                dma_req_valid <= 1'b1;
                dma_req_addr <= ipu_req_addr;
                dma_req_length <= ipu_req_length;
                dma_req_tag <= ipu_req_tag;
            end

            if (dma_req_valid && dma_req_ready) begin
                dma_req_valid <= 1'b0;
                ipu_rsp_valid <= 1'b1;
                ipu_rsp_status <= 32'd0;
            end
        end
    end
endmodule
endmodule
```
