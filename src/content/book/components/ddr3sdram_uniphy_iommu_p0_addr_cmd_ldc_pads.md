---
title: "DDR3 P0 Addr/Cmd LDC Pads — ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v"
description: "Banked array of leveled address and command I/O pads for multi-rank DDR3 topologies."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Addr/Cmd LDC Pads — ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v`

## Description

Top-level address/command pad bank implementation using PHY clocks and leveling delay chains for DDR3 command/address launch and CK generation.

## Integration Points

- Fanout from PHY-DDIO addr/cmd buses to external memory pins
- Includes CK/CK# generation and synchronized launch path

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads (
    reset_n,
    reset_n_afi_clk,
    pll_afi_clk,
    pll_mem_clk,
    pll_hr_clk,
    pll_c2p_write_clk,
    pll_write_clk,
    phy_ddio_addr_cmd_clk,
    phy_ddio_address,
    dll_delayctrl_in,
    enable_mem_clk,
    pll_dr_clk,
    phy_ddio_bank,
    phy_ddio_cs_n,
    phy_ddio_cke,
    phy_ddio_odt,
    phy_ddio_we_n,
    phy_ddio_ras_n,
    phy_ddio_cas_n,
    phy_ddio_reset_n
);
    parameter DEVICE_FAMILY = "";
    parameter MEM_ADDRESS_WIDTH = "";
    parameter AFI_ADDRESS_WIDTH = "";
    // ... multi-lane address/command pad generation ...
endmodule
```
