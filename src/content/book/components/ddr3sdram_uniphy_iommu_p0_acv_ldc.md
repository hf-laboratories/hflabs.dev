---
title: "DDR3 P0 ACV LDC — ddr3sdram_uniphy_iommu_p0_acv_ldc.v"
description: "Leveling delay chain orchestration module generating conditioned clocks for AFI and AVL domains."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_acv_ldc.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_acv_ldc.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_acv_ldc.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 ACV LDC — ddr3sdram_uniphy_iommu_p0_acv_ldc.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_acv_ldc.v`

## Description

PHY clock conditioning and leveling-delay-chain orchestration for AFI/AVL/ADC/HR clock generation in the DDR3 path.

## Integration Points

- Drives clock domains for DDR3 P0 PHY datapaths
- Uses Cyclone V clock buffer, delay chain, and phase select primitives

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_acv_ldc (
    pll_hr_clk,
    pll_dq_clk,
    pll_dqs_clk,
    dll_phy_delayctrl,
    afi_clk,
    avl_clk,
    adc_clk,
    adc_clk_cps,
    hr_clk
);
    parameter DLL_DELAY_CTRL_WIDTH = "";
    parameter ADC_PHASE_SETTING = 0;
    parameter ADC_INVERT_PHASE = "false";
    parameter IS_HHP_HPS = "false";
    // ... clock tree and phase selection logic ...
endmodule
```
