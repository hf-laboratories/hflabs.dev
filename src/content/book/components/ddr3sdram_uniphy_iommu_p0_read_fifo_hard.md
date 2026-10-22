---
title: "DDR3 P0 Read FIFO Hard — ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v"
description: "Stratix V hard periphery FIFO for safe domain transfer from DQS capture clock to core fabric."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_read_fifo_hard.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Read FIFO Hard — ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v`

## Description

Hard periphery FIFO wrapper for read-data re-synchronization from memory clock domain to internal processing clock domain.

## Integration Points

- DQS-group read capture pipeline
- Used where device family supports hard I/O read FIFO primitives

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_read_fifo_hard(
    write_clk,
    read_clk,
    read_enable,
    reset_n,
    datain,
    dataout
);
    parameter DQ_GROUP_WIDTH = "";
    localparam RATE_MULT = 2;
    // ... read FIFO hard block wiring ...
endmodule
```
