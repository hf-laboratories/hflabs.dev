---
title: "DDR3 P0 FR Cycle Extender — ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v"
description: "Extends full-rate cycle write/read valid windows to support multi-cycle CAS latency timing."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 FR Cycle Extender — ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v`

## Description

Extends full-rate cycle data windows by configurable cycle counts to support write/read alignment sequences.

## Integration Points

- Used by write datapath/control timing alignment helpers
- Works alongside FR cycle shifter blocks

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_fr_cycle_extender(
    clk,
    reset_n,
    extend_by,
    datain,
    dataout
);
    parameter DATA_WIDTH = "";
    parameter REG_POST_RESET_HIGH = "false";
    localparam RATE_MULT = 2;
    localparam REG_STAGES = 2;
    // ... staged extension logic ...
endmodule
```
