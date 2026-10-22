---
title: "DDR3 P0 Read Valid Selector — ddr3sdram_uniphy_iommu_p0_read_valid_selector.v"
description: "Programmable CAS latency shift-register matching read valid signals to memory read data bursts."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_valid_selector.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_read_valid_selector.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_valid_selector.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Read Valid Selector — ddr3sdram_uniphy_iommu_p0_read_valid_selector.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_valid_selector.v`

## Description

Selects read-enable/read-valid timing based on latency shift vectors and selected latency counters.

## Integration Points

- Read pipeline timing qualification
- Interfaces with latency shifter/training controls

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_read_valid_selector(
    reset_n,
    pll_afi_clk,
    latency_shifter,
    latency_counter,
    read_enable,
    read_valid
);
    parameter MAX_LATENCY_COUNT_WIDTH = "";
    localparam LATENCY_NUM = 2**MAX_LATENCY_COUNT_WIDTH;
    // ... decode and valid selection logic ...
endmodule
```
