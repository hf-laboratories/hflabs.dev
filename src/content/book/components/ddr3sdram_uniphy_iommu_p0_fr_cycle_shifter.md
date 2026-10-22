---
title: "DDR3 P0 FR Cycle Shifter — ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v"
description: "Shifts packed full-rate data lanes by calibrated fractional clock phases to eliminate skew."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 FR Cycle Shifter — ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v`

## Description

Shifts packed full-rate cycle lanes by programmable offsets for timing phasing and lane alignment.

## Integration Points

- Used in addr/cmd and write datapaths
- Supports dynamic shift behavior driven by sequencing logic

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter(
    clk,
    reset_n,
    shift_by,
    datain,
    dataout
);
    parameter DATA_WIDTH = "";
    parameter REG_POST_RESET_HIGH = "false";
    localparam RATE_MULT = 2;
    // ... FR-cycle shift and register logic ...
endmodule
```
