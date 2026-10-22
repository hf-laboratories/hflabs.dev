---
title: "DDR3 SDRAM UniPHY Wrapper — ddr3sdram_uniphy_iommu.v"
description: "Top-level generated DDR3 UniPHY wrapper exposing physical DRAM pins, PLLs, and Avalon-MM bus."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 SDRAM UniPHY Wrapper — ddr3sdram_uniphy_iommu.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu.v`

## Description

Top-level generated DDR3 UniPHY wrapper. Exposes memory pins and Avalon-MM access while delegating implementation to `ddr3sdram_uniphy_iommu_0002`.

## Integration Points

- Instantiated by platform top-level memory subsystem
- Bridges Avalon-MM transactions to external DDR3 interface
- Exposes calibration/init status and shared PLL clocks

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu (
    input  wire        pll_ref_clk,
    input  wire        global_reset_n,
    input  wire        soft_reset_n,
    output wire        afi_clk,
    output wire        afi_half_clk,
    output wire        afi_reset_n,
    output wire        afi_reset_export_n,
    output wire [12:0] mem_a,
    output wire [2:0]  mem_ba,
    output wire [0:0]  mem_ck,
    output wire [0:0]  mem_ck_n,
    output wire [0:0]  mem_cke,
    output wire [0:0]  mem_cs_n,
    output wire [0:0]  mem_dm,
    output wire [0:0]  mem_ras_n,
    output wire [0:0]  mem_cas_n,
    output wire [0:0]  mem_we_n,
    output wire        mem_reset_n,
    inout  wire [7:0]  mem_dq,
    inout  wire [0:0]  mem_dqs,
    inout  wire [0:0]  mem_dqs_n,
    output wire [0:0]  mem_odt,
    input  wire [20:0] avl_addr,
    input  wire        avl_read_req,
    output wire [31:0] avl_rdata,
    input  wire        avl_write_req,
    input  wire [31:0] avl_wdata,
    output wire        avl_ready,
    input  wire        avl_burstbegin,
    input  wire [2:0]  avl_size,
    input  wire [3:0]  avl_be,
    output wire        avl_rdata_valid,
    output wire        local_init_done,
    output wire        local_cal_success,
    output wire        local_cal_fail,
    input  wire        oct_rzqin
);
    ddr3sdram_uniphy_iommu_0002 ddr3sdram_uniphy_iommu_inst (...);
endmodule
```
