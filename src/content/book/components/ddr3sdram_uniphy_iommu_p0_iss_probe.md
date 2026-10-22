---
title: "DDR3 P0 ISS Probe — ddr3sdram_uniphy_iommu_p0_iss_probe.v"
description: "In-system source & probe debugging harness for real-time observation of DDR3 calibration sequences."
part: "Part II — Component Library"
chapter: "DDR3 Controller Components"
category: "DDR3 Controller Components"
filename: "ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_iss_probe.v"
order: 100
tags: ["DDR3 Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ddr3sdram_uniphy_iommu_p0_iss_probe.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_iss_probe.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DDR3 P0 ISS Probe — ddr3sdram_uniphy_iommu_p0_iss_probe.v

**Filename:** `ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_iss_probe.v`

## Description

Lightweight in-system source/probe instrumentation wrapper for observing selected DDR PHY signals.

## Integration Points

- Debug/bring-up observability for calibration and signal verification
- Connects to Intel in-system source/probe infrastructure

## Verilog Source

```verilog
`timescale 1 ps / 1 ps
module ddr3sdram_uniphy_iommu_p0_iss_probe (
    probe_input
);
    parameter WIDTH = 1;
    parameter ID_NAME = "PROB";
    input [WIDTH-1:0] probe_input;
    altsource_probe iss_probe_inst (...);
endmodule
```
