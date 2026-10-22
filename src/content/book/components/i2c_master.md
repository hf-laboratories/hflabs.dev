---
title: "I2C Master — i2c_master.v"
description: "Hardware I2C master core for querying onboard temperature sensors, voltage rails, and EEPROMs."
part: "Part II — Component Library"
chapter: "BMC Components"
category: "BMC Components"
filename: "bmc/i2c_master.v"
order: 100
tags: ["BMC Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/i2c_master.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/bmc/i2c_master.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# I2C Master — i2c_master.v

**Filename:** `bmc/i2c_master.v`

## Description

Implements a minimal I2C master for BMC control plane use. Supports basic command/data transfer, busy signaling, and status reporting.

- Parameterized clock divider
- Command/data interface
- Busy and done signaling

## Integration Points

- Used for BMC-driven I2C peripheral access
- Instantiated in management plane or peripheral logic

## Verilog Source

```verilog
// I2C Master
// Minimal I2C master for BMC control plane
module i2c_master #(
    parameter CLK_DIVIDER = 8
)(
    input  wire         clk,
    input  wire         rst_n,
    input  wire         cmd_valid,
    output wire         cmd_ready,
    input  wire [7:0]   cmd_data,
    input  wire         cmd_read,
    output reg          busy,
    output reg          scl,
    output reg          sda_out,
    output reg          sda_oe,
    input  wire         sda_in,
    output reg          cmd_done,
    output reg  [31:0]  cmd_status
);
    reg [3:0] clk_count;
    assign cmd_ready = !busy;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            busy <= 1'b0;
            scl <= 1'b1;
            sda_out <= 1'b1;
            sda_oe <= 1'b0;
            cmd_done <= 1'b0;
            cmd_status <= 32'd0;
            clk_count <= 4'd0;
        end else begin
            cmd_done <= 1'b0;
            if (cmd_valid && cmd_ready) begin
                busy <= 1'b1;
                scl <= 1'b0;
                sda_out <= cmd_data[7];
                sda_oe <= !cmd_read;
                clk_count <= CLK_DIVIDER[3:0];
            end else if (busy) begin
                if (clk_count == 4'd0) begin
                    busy <= 1'b0;
                    scl <= 1'b1;
                    sda_out <= 1'b1;
                    sda_oe <= 1'b0;
                    cmd_done <= 1'b1;
                    cmd_status <= {31'd0, sda_in};
                end else begin
                    clk_count <= clk_count - 1'b1;
                end
            end
        end
    end
endmodule
```
