---
title: "DDR3 P0 Reset Sync — ddr3sdram_uniphy_iommu_p0_reset_sync.v"
description: "Metastability-safe reset synchronizer chain used throughout the UniPHY controller."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset_sync.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_reset_sync.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset_sync.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Reset Sync — ddr3sdram_uniphy_iommu_p0_reset_sync.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset_sync.v`

## Description

Generic reset synchronizer chain used across DDR3 P0 clock domains.

## Integration Points

- Utility synchronizer for reset fanout in DDR3 PHY/control blocks
- Used by `ddr3sdram_uniphy_iommu_p0_reset`

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_reset_sync(
    reset_n,
    clk,
    reset_n_sync
);
    parameter RESET_SYNC_STAGES = 4;
    parameter NUM_RESET_OUTPUT = 1;
    // ... multi-stage reset synchronization ...
endmodule
```
