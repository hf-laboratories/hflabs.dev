---
title: "P2P TLP Generator — p2p_tlp_generator.v"
description: "Formats and issues PCIe TLP Memory Read / Write packets specifically targeted at peer device BARs."
part: "Part II — Component Library"
chapter: "P2P Communication Components"
category: "P2P Communication Components"
filename: "p2p/p2p_tlp_generator.v"
order: 100
tags: ["P2P Communication Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/p2p_tlp_generator.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/p2p/p2p_tlp_generator.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# P2P TLP Generator — p2p_tlp_generator.v

**Filename:** `p2p/p2p_tlp_generator.v`

## Description

Builds simplified peer-to-peer PCIe TLP packets from request metadata and payload fields.

## Integration Points

- Packetization stage for P2P DMA transactions
- Consumed by PCIe transmit path for host/device peer traffic

## Verilog Source

```verilog
module p2p_tlp_generator #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     req_valid,
    output wire                     req_ready,
    input  wire [ADDR_WIDTH-1:0]    req_addr,
    input  wire [31:0]              req_length,
    input  wire [7:0]               req_tag,
    input  wire                     req_is_write,
    input  wire [127:0]             req_payload,
    output reg  [DATA_WIDTH-1:0]    tlp_data,
    output reg                      tlp_valid,
    output reg                      tlp_sop,
    output reg                      tlp_eop,
    input  wire                     tlp_ready
);
// P2P TLP Generator
// Generates simplified TLP headers for peer-to-peer DMA
module p2p_tlp_generator #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     req_valid,
    output wire                     req_ready,
    input  wire [ADDR_WIDTH-1:0]    req_addr,
    input  wire [31:0]              req_length,
    input  wire [7:0]               req_tag,
    input  wire                     req_is_write,
    input  wire [127:0]             req_payload,
    output reg  [DATA_WIDTH-1:0]    tlp_data,
    output reg                      tlp_valid,
    output reg                      tlp_sop,
    output reg                      tlp_eop,
    input  wire                     tlp_ready
);

    localparam [7:0] TLP_MEM_READ  = 8'h00;
    localparam [7:0] TLP_MEM_WRITE = 8'h40;

    assign req_ready = !tlp_valid || tlp_ready;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            tlp_valid <= 1'b0;
            tlp_sop <= 1'b0;
            tlp_eop <= 1'b0;
            tlp_data <= {DATA_WIDTH{1'b0}};
        end else begin
            if (req_valid && req_ready) begin
                tlp_valid <= 1'b1;
                tlp_sop <= 1'b1;
                tlp_eop <= 1'b1;
                tlp_data <= {
                    req_payload,
                    req_addr,
                    16'd0,
                    req_length,
                    req_tag,
                    (req_is_write ? TLP_MEM_WRITE : TLP_MEM_READ)
                };
            end else if (tlp_valid && tlp_ready) begin
                tlp_valid <= 1'b0;
                tlp_sop <= 1'b0;
                tlp_eop <= 1'b0;
            end
        end
    end
endmodule
endmodule
```
