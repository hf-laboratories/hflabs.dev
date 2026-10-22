---
title: "IPU Gateway PCIe Bridge — ipu_gateway_pcie.v"
description: "Translates PCIe streaming commands into Graphcore IPU tile fabric exchange commands."
part: "Part II — Component Library"
chapter: "IPU Interface Components"
category: "IPU Interface Components"
filename: "ipu/ipu_gateway_pcie.v"
order: 100
tags: ["IPU Interface Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ipu_gateway_pcie.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/ipu/ipu_gateway_pcie.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# IPU Gateway PCIe Bridge — ipu_gateway_pcie.v

**Filename:** `ipu/ipu_gateway_pcie.v`

## Description

Bridges PCIe TLP command/response traffic to IPU command and response channels.

## Integration Points

- Boundary between host PCIe ingress/egress and IPU command plane
- Command extraction from incoming TLP headers and response repackaging onto TX path

## Verilog Source

```verilog
module ipu_gateway_pcie #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [DATA_WIDTH-1:0]    rx_tlp_data,
    input  wire                     rx_tlp_valid,
    input  wire                     rx_tlp_sop,
    input  wire                     rx_tlp_eop,
    output reg                      rx_tlp_ready,
    output reg                      ipu_cmd_valid,
    output reg  [ADDR_WIDTH-1:0]    ipu_cmd_addr,
    output reg  [15:0]              ipu_cmd_len,
    input  wire                     ipu_cmd_ready,
    input  wire [DATA_WIDTH-1:0]    ipu_rsp_data,
    input  wire                     ipu_rsp_valid,
    output reg                      ipu_rsp_ready,
    output reg  [DATA_WIDTH-1:0]    tx_tlp_data,
    output reg                      tx_tlp_valid,
    input  wire                     tx_tlp_ready
);
// IPU Gateway PCIe Bridge
// Handles IPU-specific command/response flows over PCIe TLPs
module ipu_gateway_pcie #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [DATA_WIDTH-1:0]    rx_tlp_data,
    input  wire                     rx_tlp_valid,
    input  wire                     rx_tlp_sop,
    input  wire                     rx_tlp_eop,
    output reg                      rx_tlp_ready,
    output reg                      ipu_cmd_valid,
    output reg  [ADDR_WIDTH-1:0]    ipu_cmd_addr,
    output reg  [15:0]              ipu_cmd_len,
    input  wire                     ipu_cmd_ready,
    input  wire [DATA_WIDTH-1:0]    ipu_rsp_data,
    input  wire                     ipu_rsp_valid,
    output reg                      ipu_rsp_ready,
    output reg  [DATA_WIDTH-1:0]    tx_tlp_data,
    output reg                      tx_tlp_valid,
    input  wire                     tx_tlp_ready
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            rx_tlp_ready <= 1'b1;
            ipu_cmd_valid <= 1'b0;
            ipu_cmd_addr <= {ADDR_WIDTH{1'b0}};
            ipu_cmd_len <= 16'd0;
            ipu_rsp_ready <= 1'b0;
            tx_tlp_valid <= 1'b0;
            tx_tlp_data <= {DATA_WIDTH{1'b0}};
        end else begin
            ipu_cmd_valid <= 1'b0;
            ipu_rsp_ready <= 1'b0;

            if (rx_tlp_valid && rx_tlp_sop && rx_tlp_ready) begin
                ipu_cmd_valid <= 1'b1;
                ipu_cmd_addr <= rx_tlp_data[191:128];
                ipu_cmd_len <= {6'd0, rx_tlp_data[9:0]};
            end

            if (ipu_rsp_valid && tx_tlp_ready) begin
                tx_tlp_valid <= 1'b1;
                tx_tlp_data <= ipu_rsp_data;
                ipu_rsp_ready <= 1'b1;
            end else if (tx_tlp_valid && tx_tlp_ready) begin
                tx_tlp_valid <= 1'b0;
            end
        end
    end
endmodule
endmodule
```
