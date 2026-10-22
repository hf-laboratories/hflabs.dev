---
title: "P2P Address Decoder — p2p_address_decoder.v"
description: "Decodes physical address windows to route DMA transfers directly to Peer GPUs or IPUs."
part: "Part II — Component Library"
chapter: "P2P Communication Components"
category: "P2P Communication Components"
filename: "p2p/p2p_address_decoder.v"
order: 100
tags: ["P2P Communication Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/p2p_address_decoder.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/p2p/p2p_address_decoder.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# P2P Address Decoder — p2p_address_decoder.v

**Filename:** `p2p/p2p_address_decoder.v`

## Description

Decodes transfer target class (host/GPU/IPU) from address windows using base/mask matching.

## Integration Points

- Classification stage for P2P routing decisions
- Feeds target selection into P2P DMA and TLP generation logic

## Verilog Source

```verilog
module p2p_address_decoder #(
    parameter ADDR_WIDTH = 64,
    parameter GPU_BASE = 64'h4000_0000_0000_0000,
    parameter GPU_MASK = 64'hF000_0000_0000_0000,
    parameter IPU_BASE = 64'h5000_0000_0000_0000,
    parameter IPU_MASK = 64'hF000_0000_0000_0000
)(
    input  wire [ADDR_WIDTH-1:0]    addr_in,
    input  wire                     addr_valid,
    output reg  [1:0]               target_id,
    output reg                      decode_valid,
    output reg                      is_gpu,
    output reg                      is_ipu,
    output reg                      is_host
);
// P2P Address Decoder
// Decodes peer-to-peer targets based on address windows
module p2p_address_decoder #(
    parameter ADDR_WIDTH = 64,
    parameter GPU_BASE = 64'h4000_0000_0000_0000,
    parameter GPU_MASK = 64'hF000_0000_0000_0000,
    parameter IPU_BASE = 64'h5000_0000_0000_0000,
    parameter IPU_MASK = 64'hF000_0000_0000_0000
)(
    input  wire [ADDR_WIDTH-1:0]    addr_in,
    input  wire                     addr_valid,
    output reg  [1:0]               target_id,
    output reg                      decode_valid,
    output reg                      is_gpu,
    output reg                      is_ipu,
    output reg                      is_host
);

    always @* begin
        decode_valid = addr_valid;
        target_id = 2'd0;
        is_gpu = 1'b0;
        is_ipu = 1'b0;
        is_host = 1'b0;

        if ((addr_in & GPU_MASK) == GPU_BASE) begin
            target_id = 2'd1;
            is_gpu = addr_valid;
        end else if ((addr_in & IPU_MASK) == IPU_BASE) begin
            target_id = 2'd2;
            is_ipu = addr_valid;
        end else begin
            target_id = 2'd0;
            is_host = addr_valid;
        end
    end
endmodule
endmodule
```
