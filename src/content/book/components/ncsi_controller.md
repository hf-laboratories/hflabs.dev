---
title: "NC-SI Controller — ncsi_controller.v"
description: "Network Controller Sideband Interface for pass-through out-of-band management communication."
part: "Part II — Component Library"
chapter: "BMC Components"
category: "BMC Components"
filename: "bmc/ncsi_controller.v"
order: 100
tags: ["BMC Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ncsi_controller.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/bmc/ncsi_controller.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# NC-SI Controller — ncsi_controller.v

**Filename:** `bmc/ncsi_controller.v`

## Description

Implements an NC-SI (Network Controller Sideband Interface) controller for optional sideband network management. Provides command/response handshake and link status.

- Parameterized data width
- Command/response handshake
- Link status output

## Integration Points

- Used for BMC network management
- Instantiated in management plane logic

## Verilog Source

```verilog
// NC-SI Controller
// Optional sideband network management interface
module ncsi_controller #(
    parameter DATA_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire                     ncsi_cmd_valid,
    output wire                     ncsi_cmd_ready,
    input  wire [DATA_WIDTH-1:0]    ncsi_cmd,
    output reg                      ncsi_rsp_valid,
    input  wire                     ncsi_rsp_ready,
    output reg  [DATA_WIDTH-1:0]    ncsi_rsp,
    output reg                      ncsi_link_up
);
    assign ncsi_cmd_ready = !ncsi_rsp_valid || ncsi_rsp_ready;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            ncsi_rsp_valid <= 1'b0;
            ncsi_rsp <= {DATA_WIDTH{1'b0}};
            ncsi_link_up <= 1'b0;
        end else begin
            if (ncsi_cmd_valid && ncsi_cmd_ready) begin
                ncsi_rsp_valid <= 1'b1;
                ncsi_rsp <= ncsi_cmd;
                ncsi_link_up <= 1'b1;
            end else if (ncsi_rsp_valid && ncsi_rsp_ready) begin
                ncsi_rsp_valid <= 1'b0;
            end
        end
    end
endmodule
```
