---
title: "DDR3 P0 Addr/Cmd LDC Pad — ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v"
description: "Single address/command pin driver utilizing hardware leveling delay chains for phase alignment."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Addr/Cmd LDC Pad — ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v`

## Description

Single address/command pad element using leveling-delay hardware for high-performance launch alignment.

## Integration Points

- Instantiated by `..._addr_cmd_ldc_pads.v` for each addr/cmd lane
- Uses PHY clocking and delay primitives for pin-level timing

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad (
    pll_afi_clk,
    pll_hr_clk,
    pll_c2p_write_clk,
    pll_write_clk,
    dll_delayctrl_in,
    afi_datain,
    mem_dataout
);
    parameter AFI_DATA_WIDTH = "";
    parameter MEM_DATA_WIDTH = "";
    parameter DLL_WIDTH = "";
    parameter REGISTER_C2P = "";
    // ... HR->FR and delayed launch datapath ...
endmodule
```
