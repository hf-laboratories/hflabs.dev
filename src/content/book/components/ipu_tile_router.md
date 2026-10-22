---
title: "IPU Tile Router — ipu_tile_router.v"
description: "Multi-tile non-blocking packet router for high-throughput spatial neural network tile exchange."
part: "Part II — Component Library"
chapter: "IPU Interface Components"
category: "IPU Interface Components"
filename: "ipu/ipu_tile_router.v"
order: 100
tags: ["IPU Interface Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ipu_tile_router.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ipu/ipu_tile_router.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# IPU Tile Router — ipu_tile_router.v

**Filename:** `ipu/ipu_tile_router.v`

## Description

Routes tile-to-tile messages with destination-based forwarding and simple arbitration (lower-index precedence).

## Integration Points

- Inter-tile messaging switch for lightweight on-chip IPU communication
- Connects tile ingress outputs to destination tile input channels

## Verilog Source

```verilog
module ipu_tile_router #(
    parameter NUM_TILES = 4,
    parameter DATA_WIDTH = 128,
    parameter ADDR_WIDTH = 2
)(
    input  wire [NUM_TILES-1:0]     tile_in_valid,
    input  wire [DATA_WIDTH-1:0]    tile_in_data [0:NUM_TILES-1],
    input  wire [ADDR_WIDTH-1:0]    tile_in_dest [0:NUM_TILES-1],
    output reg  [NUM_TILES-1:0]     tile_in_ready,
    output reg  [NUM_TILES-1:0]     tile_out_valid,
    output reg  [DATA_WIDTH-1:0]    tile_out_data [0:NUM_TILES-1],
    output reg  [ADDR_WIDTH-1:0]    tile_out_src [0:NUM_TILES-1],
    input  wire [NUM_TILES-1:0]     tile_out_ready
);
// IPU Tile Router
// Routes tile-to-tile messages with simple arbitration
module ipu_tile_router #(
    parameter NUM_TILES = 4,
    parameter DATA_WIDTH = 128,
    parameter ADDR_WIDTH = 2
)(
    input  wire [NUM_TILES-1:0]     tile_in_valid,
    input  wire [DATA_WIDTH-1:0]    tile_in_data [0:NUM_TILES-1],
    input  wire [ADDR_WIDTH-1:0]    tile_in_dest [0:NUM_TILES-1],
    output reg  [NUM_TILES-1:0]     tile_in_ready,
    output reg  [NUM_TILES-1:0]     tile_out_valid,
    output reg  [DATA_WIDTH-1:0]    tile_out_data [0:NUM_TILES-1],
    output reg  [ADDR_WIDTH-1:0]    tile_out_src [0:NUM_TILES-1],
    input  wire [NUM_TILES-1:0]     tile_out_ready
);

    integer i;
    integer j;
    reg [ADDR_WIDTH-1:0] dest_idx;

    always @* begin
        for (i = 0; i < NUM_TILES; i = i + 1) begin
            tile_in_ready[i] = 1'b0;
            tile_out_valid[i] = 1'b0;
            tile_out_data[i] = {DATA_WIDTH{1'b0}};
            tile_out_src[i] = {ADDR_WIDTH{1'b0}};
        end

        for (j = 0; j < NUM_TILES; j = j + 1) begin
            dest_idx = tile_in_dest[j];
            if (tile_in_valid[j]) begin
                // Lower-indexed inputs claim destinations first to avoid conflicts.
                if (dest_idx < NUM_TILES && tile_out_ready[dest_idx] && !tile_out_valid[dest_idx]) begin
                    tile_out_valid[dest_idx] = 1'b1;
                    tile_out_data[dest_idx] = tile_in_data[j];
                    tile_out_src[dest_idx] = j[ADDR_WIDTH-1:0];
                    tile_in_ready[j] = 1'b1;
                end
            end
        end
    end
endmodule
endmodule
```
