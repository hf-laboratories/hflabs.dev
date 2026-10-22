---
title: "DDR3 P0 Reset Control — ddr3sdram_uniphy_iommu_p0_reset.v"
description: "Coordinates synchronized reset assertion and deassertion across all DDR3 PHY clock domains."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_reset.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Reset Control — ddr3sdram_uniphy_iommu_p0_reset.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset.v`

## Description

Coordinates reset distribution across AFI, addr/cmd, sequencer, SCC, and capture clock domains based on PLL lock and reset inputs.

## Integration Points

- Root reset coordinator for DDR3 P0 submodules
- Instantiates reset synchronizers per clock domain

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_reset(
    seq_reset_mem_stable,
    pll_afi_clk,
    pll_addr_cmd_clk,
    pll_p2c_read_clk,
    pll_dqs_ena_clk,
    seq_clk,
    scc_clk,
    pll_avl_clk,
    reset_n_scc_clk,
    reset_n_avl_clk,
    read_capture_clk,
    pll_locked,
    global_reset_n,
    soft_reset_n,
    ctl_reset_n,
    ctl_reset_export_n,
    reset_n_afi_clk
);
    parameter MEM_READ_DQS_WIDTH = "";
    parameter NUM_AFI_RESET = 1;
    // ... domain reset synchronization and fanout ...
endmodule
```
