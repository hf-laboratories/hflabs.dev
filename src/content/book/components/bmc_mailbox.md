---
title: "BMC Mailbox — bmc_mailbox.v"
description: "Sideband mailbox register block for management plane communication between the BMC and FPGA."
part: "Part II — Component Library"
chapter: "BMC Components"
category: "BMC Components"
filename: "bmc/bmc_mailbox.v"
order: 100
tags: ["BMC Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/bmc_mailbox.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/bmc/bmc_mailbox.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# BMC Mailbox — bmc_mailbox.v

**Filename:** `bmc/bmc_mailbox.v`

## Description

Implements a simple mailbox register block for management plane communication between the BMC and FPGA logic. Supports interrupt generation and read/write access to mailbox words.

- Parameterized word count
- Read/write access
- Mailbox IRQ generation

## Integration Points

- Used for BMC↔FPGA communication
- Instantiated in management plane logic

## Verilog Source

```verilog
// BMC Mailbox
// Simple mailbox registers for management plane communication
module bmc_mailbox #(
    parameter WORD_COUNT = 8,
    parameter ADDR_WIDTH = 3
)(
    input  wire         clk,
    input  wire         rst_n,
    input  wire         wr_en,
    input  wire [ADDR_WIDTH-1:0] wr_addr,
    input  wire [31:0]  wr_data,
    input  wire         rd_en,
    input  wire [ADDR_WIDTH-1:0] rd_addr,
    output reg  [31:0]  rd_data,
    output reg          rd_valid,
    output reg          mailbox_irq,
    input  wire         mailbox_irq_clear
);
    reg [31:0] mailbox [0:WORD_COUNT-1];
    integer i;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            rd_data <= 32'd0;
            rd_valid <= 1'b0;
            mailbox_irq <= 1'b0;
            for (i = 0; i < WORD_COUNT; i = i + 1) begin
                mailbox[i] <= 32'd0;
            end
        end else begin
            rd_valid <= 1'b0;
            if (wr_en) begin
                mailbox[wr_addr] <= wr_data;
                mailbox_irq <= 1'b1;
            end
            if (rd_en) begin
                rd_data <= mailbox[rd_addr];
                rd_valid <= 1'b1;
            end
            if (mailbox_irq_clear) begin
                mailbox_irq <= 1'b0;
            end
        end
    end
endmodule
```
