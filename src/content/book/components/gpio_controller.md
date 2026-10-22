---
title: "GPIO Controller — gpio_controller.v"
description: "General-purpose I/O controller with programmable direction, interrupt on change, and status registers."
part: "Part II — Component Library"
chapter: "BMC Components"
category: "BMC Components"
filename: "bmc/gpio_controller.v"
order: 100
tags: ["BMC Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/gpio_controller.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/bmc/gpio_controller.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# GPIO Controller — gpio_controller.v

**Filename:** `bmc/gpio_controller.v`

## Description

Implements a simple GPIO controller with direction and output registers. Allows software to control and monitor GPIO pins, including direction and status.

- Parameterized GPIO width
- Direction and output control
- Status monitoring

## Integration Points

- Used for BMC-controlled GPIO expansion
- Instantiated in management plane or peripheral logic

## Verilog Source

```verilog
// GPIO Controller
// Simple GPIO controller with direction and output registers
module gpio_controller #(
    parameter GPIO_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [GPIO_WIDTH-1:0]    gpio_in,
    output reg  [GPIO_WIDTH-1:0]    gpio_out,
    output reg  [GPIO_WIDTH-1:0]    gpio_dir,
    input  wire                     write_valid,
    input  wire                     write_dir,
    input  wire [GPIO_WIDTH-1:0]    write_data,
    input  wire [GPIO_WIDTH-1:0]    write_mask,
    output reg  [GPIO_WIDTH-1:0]    gpio_status
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            gpio_out <= {GPIO_WIDTH{1'b0}};
            gpio_dir <= {GPIO_WIDTH{1'b0}};
            gpio_status <= {GPIO_WIDTH{1'b0}};
        end else begin
            gpio_status <= gpio_in;
            if (write_valid) begin
                if (write_dir) begin
                    gpio_dir <= (gpio_dir & ~write_mask) | (write_data & write_mask);
                end else begin
                    gpio_out <= (gpio_out & ~write_mask) | (write_data & write_mask);
                end
            end
        end
    end
endmodule
```
