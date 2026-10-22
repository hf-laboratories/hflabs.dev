---
title: "DDR3 P0 ALTDQDQS Bridge — ddr3sdram_uniphy_iommu_p0_altdqdqs.v"
description: "Stratix V altdq_dqs2 hard macro bridge managing bi-directional DQ data lanes and DQS strobes."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_altdqdqs.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_altdqdqs.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_altdqdqs.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 ALTDQDQS Bridge — ddr3sdram_uniphy_iommu_p0_altdqdqs.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_altdqdqs.v`

## Description

Wrapper around `altdq_dqs2_stratixv` for DQ/DQS read-write I/O timing and calibration interactions in the P0 interface.

## Integration Points

- Data strobe and DQ lane I/O bridge in PHY pad ring
- Connects write/read datapaths to hard PHY I/O primitives

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_altdqdqs (
    core_clock_in,
    reset_n_core_clock_in,
    fr_data_clock_in,
    fr_strobe_clock_in,
    hr_clock_in,
    write_strobe_clock_in,
    strobe_ena_hr_clock_in,
    strobe_ena_clock_in,
    capture_strobe_ena,
    read_write_data_io,
    write_oe_in,
    strobe_io,
    output_strobe_ena,
    strobe_n_io,
    oct_ena_in,
    read_data_out
);
    // ... altdq_dqs2_stratixv instantiation ...
endmodule
```
