---
title: "DDR3 P0 Clock Pair Generator — ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v"
description: "Generates differential CK/CK# clock pairs with matched trace delays for DDR3 SDRAM."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_clock_pair_generator.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Clock Pair Generator — ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v`

## Description

Generates differential DDR clock pair outputs (CK/CK#) from a single input clock using Stratix V output primitives.

## Integration Points

- DDR CK/CK# generation for memory interface
- Used by addr/cmd pad subsystem for memory clock driving

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_clock_pair_generator (
    datain,
    dataout,
    dataout_b
);
    input  [0:0] datain;
    output [0:0] dataout;
    output [0:0] dataout_b;
    // ... stratixv_io_obuf + pseudo differential output logic ...
endmodule
```
