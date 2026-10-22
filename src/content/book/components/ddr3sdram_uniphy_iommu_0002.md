---
title: "DDR3 UniPHY Core Assembly — ddr3sdram_uniphy_iommu_0002.v"
description: "Internal UniPHY hardware pipeline wiring calibration AFI multiplexers and leveling delay chains."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_0002.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_0002.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_0002.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 UniPHY Core Assembly — ddr3sdram_uniphy_iommu_0002.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_0002.v`

## Description

Auto-generated internal DDR3 UniPHY integration block wiring AFI muxing, PHY datapaths, reset/control, and Avalon interconnect.

## Integration Points

- Internal submodule under the top-level DDR3 wrapper
- Connects controller-side AFI, PHY pad logic, and calibration infrastructure

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_0002 (
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
    output wire        avl_ready
);
    // Auto-generated interconnect and PHY wiring
endmodule
```
