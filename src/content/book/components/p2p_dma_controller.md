---
title: "P2P DMA Controller — p2p_dma_controller.v"
description: "Orchestrates direct Peer-to-Peer PCIe DMA transfers between FPGA, GPU, and NVMe endpoints."
part: "Part II — Component Library"
chapter: "P2P Communication Components"
category: "P2P Communication Components"
filename: "p2p/p2p_dma_controller.v"
order: 100
tags: ["P2P Communication Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/p2p_dma_controller.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/p2p/p2p_dma_controller.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# P2P DMA Controller — p2p_dma_controller.v

**Filename:** `p2p/p2p_dma_controller.v`

## Description

Coordinates peer-to-peer DMA transfers by combining address decoding, transfer state tracking, and TLP request emission.

## Integration Points

- Main P2P orchestration block between source agents and PCIe TLP path
- Instantiates/uses address decoder and TLP generator components

## Verilog Source

```verilog
module p2p_dma_controller #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 256,
    parameter AGENT_WIDTH = 4
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     transfer_valid,
    output wire                     transfer_ready,
    input  wire [AGENT_WIDTH-1:0]   transfer_src_agent,
    input  wire [AGENT_WIDTH-1:0]   transfer_dst_agent,
    input  wire [ADDR_WIDTH-1:0]    transfer_addr,
    input  wire [31:0]              transfer_length,
    input  wire [7:0]               transfer_tag,
    output reg                      transfer_done,
    output reg  [31:0]              transfer_status,
    output wire [DATA_WIDTH-1:0]    tlp_data,
    output wire                     tlp_valid
);
// P2P DMA Controller
// Orchestrates P2P DMA transfers and TLP generation
module p2p_dma_controller #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 256,
    parameter AGENT_WIDTH = 4
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     transfer_valid,
    output wire                     transfer_ready,
    input  wire [AGENT_WIDTH-1:0]   transfer_src_agent,
    input  wire [AGENT_WIDTH-1:0]   transfer_dst_agent,
    input  wire [ADDR_WIDTH-1:0]    transfer_addr,
    input  wire [31:0]              transfer_length,
    input  wire [7:0]               transfer_tag,
    output reg                      transfer_done,
    output reg  [31:0]              transfer_status,
    output wire [DATA_WIDTH-1:0]    tlp_data,
    output wire                     tlp_valid,
    output wire                     tlp_sop,
    output wire                     tlp_eop,
    input  wire                     tlp_ready,
    output wire [1:0]               target_id
);

    localparam integer TRANSFER_META_WIDTH = 40; // 32-bit length + 8-bit tag
    localparam integer AGENT_META_WIDTH = 2 * AGENT_WIDTH;
    localparam integer PAYLOAD_PAD = 128 - (AGENT_META_WIDTH + TRANSFER_META_WIDTH); // Requires <= 128
    localparam [31:0] STATUS_SUCCESS = 32'h0;
    localparam [31:0] STATUS_UNSUPPORTED_TARGET = 32'h1;

    generate
        if (PAYLOAD_PAD < 0) begin : gen_payload_pad_assert
            initial $fatal("PAYLOAD_PAD underflow: adjust AGENT_WIDTH or payload layout.");
        end
    endgenerate

    wire                      decode_valid;
    wire                      is_gpu;
    wire                      is_ipu;
    wire                      is_host;
    wire                      tlp_req_ready;
    wire                      tlp_req_valid;
    reg                       active;

    wire [127:0] tlp_payload = {
        {PAYLOAD_PAD{1'b0}},
        transfer_src_agent,
        transfer_dst_agent,
        transfer_length,
        transfer_tag
    };

    p2p_address_decoder addr_decoder (
        .addr_in(transfer_addr),
        .addr_valid(tlp_req_valid),
        .target_id(target_id),
        .decode_valid(decode_valid),
        .is_gpu(is_gpu),
        .is_ipu(is_ipu),
        .is_host(is_host)
    );

    p2p_tlp_generator #(
        .DATA_WIDTH(DATA_WIDTH),
        .ADDR_WIDTH(ADDR_WIDTH)
    ) tlp_gen (
        .clk(clk),
        .rst_n(rst_n),
        .req_valid(tlp_req_valid),
        .req_ready(tlp_req_ready),
        .req_addr(transfer_addr),
        .req_length(transfer_length),
        .req_tag(transfer_tag),
        .req_is_write(1'b1),
        .req_payload(tlp_payload),
        .tlp_data(tlp_data),
        .tlp_valid(tlp_valid),
        .tlp_sop(tlp_sop),
        .tlp_eop(tlp_eop),
        .tlp_ready(tlp_ready)
    );

    assign transfer_ready = !active && tlp_req_ready;
    assign tlp_req_valid = transfer_valid && !active;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            active <= 1'b0;
            transfer_done <= 1'b0;
            transfer_status <= 32'd0;
        end else begin
            transfer_done <= 1'b0;

            if (transfer_valid && transfer_ready) begin
                active <= 1'b1;
                if (is_host || !decode_valid) begin
                    transfer_status <= STATUS_UNSUPPORTED_TARGET;
                end else begin
                    transfer_status <= STATUS_SUCCESS;
                end
            end

            if (active && tlp_valid && tlp_ready) begin
                active <= 1'b0;
                transfer_done <= 1'b1;
            end
        end
    end
endmodule
endmodule
```
