---
title: "DMA FIFOs — dma_fifos.v"
description: "Dual-clock decoupled FIFO buffers for descriptor rings, read streaming data, and write streaming data."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_fifos.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_fifos.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_fifos.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA FIFOs — dma_fifos.v

**Filename:** `dma_engine/dma_fifos.v`

## Description

Packages descriptor/read-data/write-data synchronous FIFOs used to decouple DMA pipeline stages.

## Integration Points

- Buffering between descriptor fetch and scheduler
- Buffering between read/write engines and PCIe/NVMe interfaces

## Verilog Source

```verilog
module dma_fifos #(
    parameter DATA_WIDTH = 512,
    parameter DESC_WIDTH = 128,
    parameter DATA_DEPTH = 32,
    parameter DESC_DEPTH = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [DESC_WIDTH-1:0]    desc_wr_data,
    input  wire                     desc_wr_en,
    output wire                     desc_full,
    output wire [DESC_WIDTH-1:0]    desc_rd_data,
    input  wire                     desc_rd_en,
    output wire                     desc_empty
);
// DMA FIFOs for buffering data and descriptors
module dma_fifos #(
    parameter DATA_WIDTH = 512,    // Data path width (64 bytes)
    parameter DESC_WIDTH = 128,    // Descriptor width
    parameter DATA_DEPTH = 32,     // Data FIFO depth
    parameter DESC_DEPTH = 16      // Descriptor FIFO depth
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Descriptor FIFO write (from descriptor fetch)
    input  wire [DESC_WIDTH-1:0]    desc_wr_data,
    input  wire                     desc_wr_en,
    output wire                     desc_full,
    
    // Descriptor FIFO read (to scheduler)
    output wire [DESC_WIDTH-1:0]    desc_rd_data,
    input  wire                     desc_rd_en,
    output wire                     desc_empty,
    
    // Read data FIFO write (from read engine)
    input  wire [DATA_WIDTH-1:0]    rdata_wr_data,
    input  wire                     rdata_wr_en,
    output wire                     rdata_full,
    
    // Read data FIFO read (to PCIe)
    output wire [DATA_WIDTH-1:0]    rdata_rd_data,
    input  wire                     rdata_rd_en,
    output wire                     rdata_empty,
    
    // Write data FIFO write (from PCIe)
    input  wire [DATA_WIDTH-1:0]    wdata_wr_data,
    input  wire                     wdata_wr_en,
    output wire                     wdata_full,
    
    // Write data FIFO read (to write engine)
    output wire [DATA_WIDTH-1:0]    wdata_rd_data,
    input  wire                     wdata_rd_en,
    output wire                     wdata_empty
);

    // Descriptor FIFO
    fifo_sync #(
        .DATA_WIDTH(DESC_WIDTH),
        .DEPTH(DESC_DEPTH)
    ) desc_fifo (
        .clk(clk),
        .rst_n(rst_n),
        .wr_data(desc_wr_data),
        .wr_en(desc_wr_en),
        .full(desc_full),
        .wr_count(),
        .rd_data(desc_rd_data),
        .rd_en(desc_rd_en),
        .empty(desc_empty),
        .rd_count()
    );
    
    // Read data FIFO
    fifo_sync #(
        .DATA_WIDTH(DATA_WIDTH),
        .DEPTH(DATA_DEPTH)
    ) rdata_fifo (
        .clk(clk),
        .rst_n(rst_n),
        .wr_data(rdata_wr_data),
        .wr_en(rdata_wr_en),
        .full(rdata_full),
        .wr_count(),
        .rd_data(rdata_rd_data),
        .rd_en(rdata_rd_en),
        .empty(rdata_empty),
        .rd_count()
    );
    
    // Write data FIFO
    fifo_sync #(
        .DATA_WIDTH(DATA_WIDTH),
        .DEPTH(DATA_DEPTH)
    ) wdata_fifo (
        .clk(clk),
        .rst_n(rst_n),
        .wr_data(wdata_wr_data),
        .wr_en(wdata_wr_en),
        .full(wdata_full),
        .wr_count(),
        .rd_data(wdata_rd_data),
        .rd_en(wdata_rd_en),
        .empty(wdata_empty),
        .rd_count()
    );

endmodule
endmodule
```
