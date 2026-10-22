---
title: "Asynchronous FIFO — fifo_async.v"
description: "Dual-clock asynchronous FIFO with Gray code pointer synchronization across unrelated clock domains."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/fifo_async.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/fifo_async.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/fifo_async.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Asynchronous FIFO — fifo_async.v

**Filename:** `util/fifo_async.v`

## Description

Implements an asynchronous FIFO for safe clock domain crossing. Uses Gray code pointers for robust CDC and provides full/empty status. Suitable for buffering data between modules on different clock domains.

- Parameterized data width and depth
- Gray code pointer synchronization
- Safe for CDC scenarios

## Integration Points

- Used for buffering between modules on different clock domains
- Inserted at CDC boundaries for safe data transfer

## Verilog Source

```verilog
// Asynchronous FIFO for clock domain crossing
// Uses Gray code pointers for safe CDC
module fifo_async #(
    parameter DATA_WIDTH = 32,
    parameter DEPTH = 16,
    parameter ADDR_WIDTH = $clog2(DEPTH)
)(
    // Write clock domain
    input  wire                     wr_clk,
    input  wire                     wr_rst_n,
    input  wire [DATA_WIDTH-1:0]    wr_data,
    input  wire                     wr_en,
    output wire                     full,
    // Read clock domain
    input  wire                     rd_clk,
    input  wire                     rd_rst_n,
    output wire [DATA_WIDTH-1:0]    rd_data,
    input  wire                     rd_en,
    output wire                     empty
);
    // Binary pointers
    reg [ADDR_WIDTH:0] wr_ptr_bin;
    reg [ADDR_WIDTH:0] rd_ptr_bin;
    // Gray code pointers
    reg [ADDR_WIDTH:0] wr_ptr_gray;
    reg [ADDR_WIDTH:0] rd_ptr_gray;
    // Synchronized Gray pointers
    reg [ADDR_WIDTH:0] wr_ptr_gray_sync1, wr_ptr_gray_sync2;
    reg [ADDR_WIDTH:0] rd_ptr_gray_sync1, rd_ptr_gray_sync2;
    // Memory array
    reg [DATA_WIDTH-1:0] mem [0:DEPTH-1];
    // Binary to Gray conversion
    function [ADDR_WIDTH:0] bin2gray;
        input [ADDR_WIDTH:0] binary;
        begin
            bin2gray = binary ^ (binary >> 1);
        end
    endfunction
    // Gray to Binary conversion
    function [ADDR_WIDTH:0] gray2bin;
        input [ADDR_WIDTH:0] gray;
        integer i;
        begin
            gray2bin[ADDR_WIDTH] = gray[ADDR_WIDTH];
            for (i = ADDR_WIDTH-1; i >= 0; i = i - 1) begin
                gray2bin[i] = gray2bin[i+1] ^ gray[i];
            end
        end
    endfunction
    // Write clock domain
    wire [ADDR_WIDTH:0] rd_ptr_bin_sync = gray2bin(rd_ptr_gray_sync2);
    always @(posedge wr_clk or negedge wr_rst_n) begin
        if (!wr_rst_n) begin
            wr_ptr_bin <= {(ADDR_WIDTH+1){1'b0}};
            wr_ptr_gray <= {(ADDR_WIDTH+1){1'b0}};
        end else if (wr_en && !full) begin
            mem[wr_ptr_bin[ADDR_WIDTH-1:0]] <= wr_data;
            wr_ptr_bin <= wr_ptr_bin + 1'b1;
            wr_ptr_gray <= bin2gray(wr_ptr_bin + 1'b1);
        end
    end
    // Synchronize read pointer to write clock domain
    always @(posedge wr_clk or negedge wr_rst_n) begin
        if (!wr_rst_n) begin
            rd_ptr_gray_sync1 <= {(ADDR_WIDTH+1){1'b0}};
            rd_ptr_gray_sync2 <= {(ADDR_WIDTH+1){1'b0}};
        end else begin
            rd_ptr_gray_sync1 <= rd_ptr_gray;
            rd_ptr_gray_sync2 <= rd_ptr_gray_sync1;
        end
    end
    // Full flag
    assign full = (wr_ptr_gray == {~rd_ptr_gray_sync2[ADDR_WIDTH:ADDR_WIDTH-1], 
                                    rd_ptr_gray_sync2[ADDR_WIDTH-2:0]});
    // Read clock domain
    wire [ADDR_WIDTH:0] wr_ptr_bin_sync = gray2bin(wr_ptr_gray_sync2);
    reg [DATA_WIDTH-1:0] rd_data_reg;
    always @(posedge rd_clk or negedge rd_rst_n) begin
        if (!rd_rst_n) begin
            rd_ptr_bin <= {(ADDR_WIDTH+1){1'b0}};
            rd_ptr_gray <= {(ADDR_WIDTH+1){1'b0}};
            rd_data_reg <= {DATA_WIDTH{1'b0}};
        end else if (rd_en && !empty) begin
            rd_data_reg <= mem[rd_ptr_bin[ADDR_WIDTH-1:0]];
            rd_ptr_bin <= rd_ptr_bin + 1'b1;
            rd_ptr_gray <= bin2gray(rd_ptr_bin + 1'b1);
        end
    end
    // Synchronize write pointer to read clock domain
    always @(posedge rd_clk or negedge rd_rst_n) begin
        if (!rd_rst_n) begin
            wr_ptr_gray_sync1 <= {(ADDR_WIDTH+1){1'b0}};
            wr_ptr_gray_sync2 <= {(ADDR_WIDTH+1){1'b0}};
        end else begin
            wr_ptr_gray_sync1 <= wr_ptr_gray;
            wr_ptr_gray_sync2 <= wr_ptr_gray_sync1;
        end
    end
    // Empty flag
    assign empty = (rd_ptr_gray == wr_ptr_gray_sync2);
    assign rd_data = rd_data_reg;
endmodule
```
