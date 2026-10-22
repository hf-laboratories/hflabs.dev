---
title: "DDR3 P0 Write Datapath — ddr3sdram_uniphy_iommu_p0_write_datapath.v"
description: "Serializes 512-bit internal write payloads into DDIO double-data-rate write bursts."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_write_datapath.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_write_datapath.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_write_datapath.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 Write Datapath — ddr3sdram_uniphy_iommu_p0_write_datapath.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_write_datapath.v`

## Description

Transforms AFI write data, data-mask, and DQS enables into PHY-DDIO write signals with configurable cycle shift/extension handling.

## Integration Points

- Core write path from AFI-side controller to PHY pad outputs
- Uses FR cycle shifter/extender helpers for launch alignment

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_write_datapath(
    pll_afi_clk,
    reset_n,
    force_oct_off,
    afi_dqs_en,
    phy_ddio_oct_ena,
    afi_wdata,
    afi_wdata_valid,
    afi_dm,
    phy_ddio_dq,
    phy_ddio_dqs_en,
    phy_ddio_wrdata_en,
    phy_ddio_wrdata_mask,
    seq_num_write_fr_cycle_shifts
);
    parameter MEM_DQ_WIDTH = "";
    parameter AFI_DATA_WIDTH = "";
    parameter NUM_WRITE_PATH_FLOP_STAGES = "";
    // ... write datapath transform logic ...
endmodule
```
