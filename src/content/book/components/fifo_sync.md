---
title: "Synchronous FIFO — fifo_sync.v"
description: "Parameterized synchronous circular FIFO buffer with almost_full and almost_empty threshold flags."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/fifo_sync.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/fifo_sync.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/fifo_sync.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Synchronous FIFO — fifo_sync.v

**Filename:** `util/fifo_sync.v`

## Description

Implements a synchronous FIFO buffer with configurable data width and depth. Used for buffering data between modules operating on the same clock domain. Provides full/empty status and count outputs for robust flow control.

- Parameterized data width and depth
- Synchronous read/write
- Full/empty flags and counters

## Integration Points

- Used for buffering between tightly-coupled modules
- Inserted in streaming data paths for flow control

## Verilog Source

```verilog
// Synchronous FIFO with configurable depth
module fifo_sync #(
    parameter DATA_WIDTH = 32,
    parameter DEPTH = 16,
    parameter ADDR_WIDTH = $clog2(DEPTH)
)(
    input  wire                     clk,
    input  wire                     rst_n,
    // Write interface
    input  wire [DATA_WIDTH-1:0]    wr_data,
    input  wire                     wr_en,
    output wire                     full,
    output wire [ADDR_WIDTH:0]      wr_count,
    // Read interface
    output wire [DATA_WIDTH-1:0]    rd_data,
    input  wire                     rd_en,
    output wire                     empty,
    output wire [ADDR_WIDTH:0]      rd_count
);
    // Memory array
    reg [DATA_WIDTH-1:0] mem [0:DEPTH-1];
    // Read and write pointers
    reg [ADDR_WIDTH:0] wr_ptr;
    reg [ADDR_WIDTH:0] rd_ptr;
    wire [ADDR_WIDTH-1:0] wr_addr = wr_ptr[ADDR_WIDTH-1:0];
    wire [ADDR_WIDTH-1:0] rd_addr = rd_ptr[ADDR_WIDTH-1:0];
    // Status flags
    assign empty = (wr_ptr == rd_ptr);
    assign full  = (wr_ptr[ADDR_WIDTH] != rd_ptr[ADDR_WIDTH]) && 
                   (wr_ptr[ADDR_WIDTH-1:0] == rd_ptr[ADDR_WIDTH-1:0]);
    // Count calculation
    assign wr_count = wr_ptr - rd_ptr;
    assign rd_count = wr_ptr - rd_ptr;
    // Write logic
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            wr_ptr <= {(ADDR_WIDTH+1){1'b0}};
        end else if (wr_en && !full) begin
            mem[wr_addr] <= wr_data;
            wr_ptr <= wr_ptr + 1'b1;
        end
    end
    // Read logic
    reg [DATA_WIDTH-1:0] rd_data_reg;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            rd_ptr <= {(ADDR_WIDTH+1){1'b0}};
            rd_data_reg <= {DATA_WIDTH{1'b0}};
        end else if (rd_en && !empty) begin
            rd_data_reg <= mem[rd_addr];
            rd_ptr <= rd_ptr + 1'b1;
        end
    end
    assign rd_data = rd_data_reg;
endmodule
```
