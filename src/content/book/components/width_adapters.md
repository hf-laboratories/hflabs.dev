---
title: "Width Adapters — width_adapters.v"
description: "Convenience wrappers for PCIe (256-bit) to DMA (512-bit) bidirectional width conversion."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/width_adapters.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/width_adapters.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/width_adapters.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Width Adapters — width_adapters.v

**Filename:** `util/width_adapters.v`

## Description

Convenience wrappers for common PCIe↔DMA width conversions. These modules instantiate the `width_converter` with fixed parameters for typical integration scenarios, reducing wiring errors and making integration safer and faster.

- `pcie_dma_width_adapter`: 256-bit PCIe → 512-bit DMA
- `dma_pcie_width_adapter`: 512-bit DMA → 256-bit PCIe

## Integration Points

- Used at PCIe↔DMA boundaries in top-level modules
- Default interface layer for subsystem integration
- Testbench coverage in `tb_dma_engine.v`

## Verilog Source

```verilog
// PCIe to DMA Width Converter Wrapper
// Integrates width converter with flow control for PCIe-DMA interface

module pcie_dma_width_adapter #(
    parameter PCIE_WIDTH = 256,
    parameter DMA_WIDTH = 512
)(
    input  wire                     clk,
    input  wire                     rst_n,
    // PCIe side (256-bit)
    input  wire [PCIE_WIDTH-1:0]    pcie_data,
    input  wire                     pcie_valid,
    input  wire                     pcie_last,
    output wire                     pcie_ready,
    // DMA side (512-bit)
    output wire [DMA_WIDTH-1:0]     dma_data,
    output wire                     dma_valid,
    output wire                     dma_last,
    input  wire                     dma_ready
);
    // Instantiate width converter
    width_converter #(
        .INPUT_WIDTH(PCIE_WIDTH),
        .OUTPUT_WIDTH(DMA_WIDTH)
    ) width_conv_inst (
        .clk(clk),
        .rst_n(rst_n),
        .s_data(pcie_data),
        .s_valid(pcie_valid),
        .s_last(pcie_last),
        .s_ready(pcie_ready),
        .m_data(dma_data),
        .m_valid(dma_valid),
        .m_last(dma_last),
        .m_ready(dma_ready)
    );
endmodule

// DMA to PCIe Width Converter Wrapper
module dma_pcie_width_adapter #(
    parameter DMA_WIDTH = 512,
    parameter PCIE_WIDTH = 256
)(
    input  wire                     clk,
    input  wire                     rst_n,
    // DMA side (512-bit)
    input  wire [DMA_WIDTH-1:0]     dma_data,
    input  wire                     dma_valid,
    input  wire                     dma_last,
    output wire                     dma_ready,
    // PCIe side (256-bit)
    output wire [PCIE_WIDTH-1:0]    pcie_data,
    output wire                     pcie_valid,
    output wire                     pcie_last,
    input  wire                     pcie_ready
);
    // Instantiate width converter
    width_converter #(
        .INPUT_WIDTH(DMA_WIDTH),
        .OUTPUT_WIDTH(PCIE_WIDTH)
    ) width_conv_inst (
        .clk(clk),
        .rst_n(rst_n),
        .s_data(dma_data),
        .s_valid(dma_valid),
        .s_last(dma_last),
        .s_ready(dma_ready),
        .m_data(pcie_data),
        .m_valid(pcie_valid),
        .m_last(pcie_last),
        .m_ready(pcie_ready)
    );
endmodule
```
