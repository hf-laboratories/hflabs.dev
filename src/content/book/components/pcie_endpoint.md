---
title: "PCIe Endpoint — pcie_endpoint.v"
description: "Top-level PCIe Gen3 x8 endpoint integrating Hard IP, BAR decoding, and Avalon-ST channels."
part: "Part II — Component Library"
chapter: "PCIe & HIP Unlock Components"
category: "PCIe & HIP Unlock Components"
filename: "pcie_endpoint.v"
order: 100
tags: ["PCIe & HIP Unlock Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/pcie_endpoint.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/pcie_endpoint.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# PCIe Endpoint — pcie_endpoint.v

**Filename:** `pcie_endpoint.v`

## Description

Provides a Stratix V-style PCIe endpoint wrapper with memory read/write request handling, configuration outputs, MSI signaling, and link-status reporting.

## Integration Points

- Front-door PCIe endpoint abstraction for higher-level FPGA datapaths
- Connects memory transaction channels to downstream DMA and BAR logic
- Exposes MSI/MSI-X style interrupt request/ack path to system interrupt flow

## README Integration Notes

From the project-level `catapult_ptp/README.md`, this endpoint is part of the primary control/data ingress plane:

- Terminates PCIe Gen3 x8 host traffic at the FPGA boundary
- Feeds BAR control-plane accesses and DMA transaction streams
- Provides link/config status that downstream orchestration relies on

Important project context from the README:

- Production deployments should use the Stratix V Hard IP wrapper path (`pcie/stratix_v_pcie_hip*.v`) as the canonical implementation boundary
- Community HIP unlock documentation/tooling is available under `pcie-3-hip-unlock/` for supported development workflows

References:

- [`../../README.md`](../../README.md)
- [`../../pcie-3-hip-unlock/README.md`](../../pcie-3-hip-unlock/README.md)

## Verilog Source

```verilog
module pcie_endpoint #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     pcie_refclk,
    input  wire                     pcie_rst_n,
    input  wire [7:0]               pcie_rx_p,
    input  wire [7:0]               pcie_rx_n,
    output wire [7:0]               pcie_tx_p,
    output wire [7:0]               pcie_tx_n,
    output wire                     user_clk,
    output wire                     user_rst_n,
    output wire [15:0]              cfg_device_id,
    output wire [15:0]              cfg_vendor_id,
    output wire [2:0]               cfg_max_payload,
    output wire [2:0]               cfg_max_read_req
);
// PCIe Endpoint Interface
// Stratix V Hard IP PCIe wrapper with AXI-Stream-like interface
module pcie_endpoint #(
    parameter DATA_WIDTH = 256,    // PCIe data width (256-bit for Gen3 x8)
    parameter ADDR_WIDTH = 64
)(
    // PCIe reference clock and reset
    input  wire                     pcie_refclk,
    input  wire                     pcie_rst_n,
    
    // PCIe physical interface (to pins)
    input  wire [7:0]               pcie_rx_p,
    input  wire [7:0]               pcie_rx_n,
    output wire [7:0]               pcie_tx_p,
    output wire [7:0]               pcie_tx_n,
    
    // User clock and reset (synchronized to PCIe)
    output wire                     user_clk,
    output wire                     user_rst_n,
    
    // Configuration space interface
    output wire [15:0]              cfg_device_id,
    output wire [15:0]              cfg_vendor_id,
    output wire [2:0]               cfg_max_payload,
    output wire [2:0]               cfg_max_read_req,
    
    // Memory read request interface
    input  wire [ADDR_WIDTH-1:0]    mem_rd_addr,
    input  wire [10:0]              mem_rd_len,      // In DWORDs
    input  wire                     mem_rd_req,
    output reg                      mem_rd_ack,
    
    // Memory read completion interface
    output reg  [DATA_WIDTH-1:0]    mem_rd_data,
    output reg                      mem_rd_valid,
    output reg                      mem_rd_last,
    input  wire                     mem_rd_ready,
    
    // Memory write request interface
    input  wire [ADDR_WIDTH-1:0]    mem_wr_addr,
    input  wire [DATA_WIDTH-1:0]    mem_wr_data,
    input  wire [10:0]              mem_wr_len,      // In DWORDs
    input  wire                     mem_wr_valid,
    output reg                      mem_wr_ready,
    
    // Interrupt interface (MSI/MSI-X)
    input  wire                     msi_req,
    input  wire [7:0]               msi_vector,
    output reg                      msi_ack,
    
    // BAR hit signals
    output wire [5:0]               bar_hit,
    
    // Status
    output wire                     link_up,
    output wire [3:0]               link_width,
    output wire [2:0]               link_speed
);

    // User clock domain (250 MHz for Gen3)
    reg user_clk_reg;
    reg user_rst_n_reg;
    
    assign user_clk = user_clk_reg;
    assign user_rst_n = user_rst_n_reg;
    
    // Configuration space registers
    assign cfg_device_id = 16'h0001;
    assign cfg_vendor_id = 16'h1172;  // Altera vendor ID
    assign cfg_max_payload = 3'd5;     // 4096 bytes
    assign cfg_max_read_req = 3'd5;    // 4096 bytes
    
    // Link status
    reg link_up_reg;
    reg [3:0] link_width_reg;
    reg [2:0] link_speed_reg;
    
    assign link_up = link_up_reg;
    assign link_width = link_width_reg;
    assign link_speed = link_speed_reg;
    
    // BAR configuration (placeholder)
    assign bar_hit = 6'b000001;  // BAR0 hit by default
    
    // Clock generation (simplified - in real design use PLL)
    always @(posedge pcie_refclk or negedge pcie_rst_n) begin
        if (!pcie_rst_n) begin
            user_clk_reg <= 1'b0;
            user_rst_n_reg <= 1'b0;
        end else begin
            user_clk_reg <= ~user_clk_reg;  // Divide by 2
            user_rst_n_reg <= pcie_rst_n;
        end
    end
    
    // Initialize link status
    initial begin
        link_up_reg = 1'b1;
        link_width_reg = 4'd8;    // x8
        link_speed_reg = 3'd3;    // Gen3
    end
    
    // Memory read request state machine
    localparam RD_IDLE = 2'd0;
    localparam RD_PROCESS = 2'd1;
    localparam RD_COMPLETE = 2'd2;
    
    reg [1:0] rd_state;
    reg [10:0] rd_beats_remaining;
    reg [10:0] rd_beat_count;
    
    always @(posedge user_clk or negedge user_rst_n) begin
        if (!user_rst_n) begin
            rd_state <= RD_IDLE;
            mem_rd_ack <= 1'b0;
            mem_rd_data <= {DATA_WIDTH{1'b0}};
            mem_rd_valid <= 1'b0;
            mem_rd_last <= 1'b0;
            rd_beats_remaining <= 11'd0;
            rd_beat_count <= 11'd0;
        end else begin
            case (rd_state)
                RD_IDLE: begin
                    if (mem_rd_req) begin
                        mem_rd_ack <= 1'b1;
                        rd_beats_remaining <= (mem_rd_len + 7) >> 3;  // Convert DWORDs to 256-bit beats
                        rd_beat_count <= 11'd0;
                        rd_state <= RD_PROCESS;
                    end else begin
                        mem_rd_ack <= 1'b0;
                    end
                end
                
                RD_PROCESS: begin
                    mem_rd_ack <= 1'b0;
                    
                    if (rd_beats_remaining > 0) begin
                        mem_rd_valid <= 1'b1;
                        mem_rd_data <= {DATA_WIDTH{1'b1}};  // Placeholder data
                        mem_rd_last <= (rd_beats_remaining == 1);
                        
                        if (mem_rd_valid && mem_rd_ready) begin
                            rd_beats_remaining <= rd_beats_remaining - 1'b1;
                            rd_beat_count <= rd_beat_count + 1'b1;
                            
                            if (rd_beats_remaining == 1) begin
                                rd_state <= RD_COMPLETE;
                            end
                        end
                    end
                end
                
                RD_COMPLETE: begin
                    mem_rd_valid <= 1'b0;
                    mem_rd_last <= 1'b0;
                    rd_state <= RD_IDLE;
                end
                
                default: rd_state <= RD_IDLE;
            endcase
        end
    end
    
    // Memory write handling (simplified - just acknowledge)
    always @(posedge user_clk or negedge user_rst_n) begin
        if (!user_rst_n) begin
            mem_wr_ready <= 1'b0;
        end else begin
            mem_wr_ready <= 1'b1;  // Always ready in this simplified version
        end
    end
    
    // MSI handling
    always @(posedge user_clk or negedge user_rst_n) begin
        if (!user_rst_n) begin
            msi_ack <= 1'b0;
        end else begin
            if (msi_req) begin
                msi_ack <= 1'b1;
            end else begin
                msi_ack <= 1'b0;
            end
        end
    end

endmodule
endmodule
```
