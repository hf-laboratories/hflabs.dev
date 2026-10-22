---
title: "DDR3 P0 Addr/Cmd Datapath — ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v"
description: "Transforms parallel AFI address and command buses into DDIO-aligned physical memory signals."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Addr/Cmd Datapath — ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v`

## Description

Transforms AFI address/command buses into PHY-DDIO aligned outputs, including optional full-rate cycle shifting for timing alignment.

## Integration Points

- Connects AFI command bus to DDR3 address/control I/O pad layer
- Uses FR cycle shifter helpers for command timing placement

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath(
    clk,
    reset_n,
    afi_address,
    afi_bank,
    afi_cs_n,
    afi_cke,
    afi_odt,
    afi_ras_n,
    afi_cas_n,
    afi_we_n,
    afi_rst_n,
    phy_ddio_address,
    phy_ddio_bank,
    phy_ddio_cs_n,
    phy_ddio_cke,
    phy_ddio_we_n,
    phy_ddio_ras_n,
    phy_ddio_cas_n,
    phy_ddio_reset_n,
    phy_ddio_odt
);
    parameter MEM_ADDRESS_WIDTH = "";
    parameter AFI_ADDRESS_WIDTH = "";
    // ... AFI to PHY command path conversion ...
endmodule
```
