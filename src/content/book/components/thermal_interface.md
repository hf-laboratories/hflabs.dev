---
title: "Thermal Interface — thermal_interface.v"
description: "Monitors onboard ADC thermal diodes and triggers automated throttling upon high-temp thresholds."
part: "Part II — Component Library"
chapter: "BMC Components"
category: "BMC Components"
filename: "bmc/thermal_interface.v"
order: 100
tags: ["BMC Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/thermal_interface.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/bmc/thermal_interface.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Thermal Interface — thermal_interface.v

**Filename:** `bmc/thermal_interface.v`

## Description

Tracks temperature and exposes an over-temperature flag for BMC monitoring. Converts raw sensor input to Celsius and asserts an overtemp signal if the threshold is exceeded.

- Parameterized temperature width
- Overtemperature detection
- Celsius conversion

## Integration Points

- Used for BMC thermal monitoring
- Instantiated in management plane logic

## Verilog Source

```verilog
// Thermal Interface
// Tracks temperature and exposes an over-temperature flag
module thermal_interface #(
    parameter TEMP_WIDTH = 12
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [TEMP_WIDTH-1:0]    temp_sensor_raw,
    input  wire [TEMP_WIDTH-1:0]    temp_threshold,
    output reg  [15:0]              temp_celsius,
    output reg                      overtemp
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            temp_celsius <= 16'd0;
            overtemp <= 1'b0;
        end else begin
            temp_celsius <= {4'd0, temp_sensor_raw};
            overtemp <= (temp_sensor_raw >= temp_threshold);
        end
    end
endmodule
```
