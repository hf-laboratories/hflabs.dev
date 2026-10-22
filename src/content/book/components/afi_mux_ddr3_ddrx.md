---
title: "AFI Mux DDR3 DDRx — afi_mux_ddr3_ddrx.v"
description: "Multiplexes AFI signals between the calibration sequencer and runtime memory controller."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/afi_mux_ddr3_ddrx.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/afi_mux_ddr3_ddrx.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/afi_mux_ddr3_ddrx.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# AFI Mux DDR3 DDRx — afi_mux_ddr3_ddrx.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/afi_mux_ddr3_ddrx.v`

## Description

Multiplexes AFI signals between sequencer and controller paths. During calibration it selects sequencer signals; after calibration it switches to controller signals.

## Integration Points

- AFI path arbitration during DDR calibration and normal operation
- Interfaces with PHY mux/control logic

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module afi_mux_ddr3_ddrx (
    clk,
    mux_sel,
    afi_addr,
    afi_ba,
    afi_cs_n,
    afi_cke,
    afi_odt,
    afi_ras_n,
    afi_cas_n,
    afi_we_n,
    afi_dm,
    afi_wlat,
    afi_rlat,
    afi_rst_n,
    afi_dqs_burst,
    afi_wdata,
    afi_wdata_valid,
    afi_rdata_en,
    afi_rdata_en_full,
    afi_rdata,
    afi_rdata_valid
);
    parameter AFI_ADDR_WIDTH = 0;
    parameter AFI_BANKADDR_WIDTH = 0;
    parameter AFI_CS_WIDTH = 0;
    input clk;
    input mux_sel;
    // ... controller and sequencer AFI interfaces ...
endmodule
```
