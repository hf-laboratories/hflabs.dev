---
title: "Stratix V PCIe HIP Wrapper — stratix_v_pcie_hip.v"
description: "Stratix V PCIe Gen3 x8 Hard IP core wrapper providing a clean TLP interface for DMA and application logic."
part: "Part II — Component Library"
chapter: "PCIe & HIP Unlock Components"
category: "PCIe & HIP Unlock Components"
filename: "pcie/stratix_v_pcie_hip.v"
order: 100
tags: ["PCIe & HIP Unlock Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/stratix_v_pcie_hip.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/pcie/stratix_v_pcie_hip.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Stratix V PCIe HIP Wrapper — stratix_v_pcie_hip.v

**Filename:** `pcie/stratix_v_pcie_hip.v`

## Description

Wraps the Stratix V Gen3 x8 PCIe Hard IP interface behind a simplified application-facing TLP/BAR/MSI interface, with notes for license-unlock workflows.

## Integration Points

- Primary bridge between PCIe hard IP pins and fabric-level transaction channels
- Connects TLP RX/TX streams to DMA engines and request routing logic
- Serves as a baseline wrapper for deployments not requiring enhanced diagnostics

## Verilog Source

```verilog
module stratix_v_pcie_hip #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     pcie_refclk_p,
    input  wire                     pcie_refclk_n,
    input  wire [7:0]               pcie_rx_p,
    input  wire [7:0]               pcie_rx_n,
    output wire [7:0]               pcie_tx_p,
    output wire [7:0]               pcie_tx_n,
    input  wire                     pcie_perst_n,
    output wire                     app_clk,
    output wire                     app_rst_n,
    output wire [DATA_WIDTH-1:0]    rx_tdata,
    input  wire [DATA_WIDTH-1:0]    tx_tdata
);
// Stratix V PCIe Hard IP Core Wrapper
// Integrates Intel/Altera Stratix V PCIe Gen3 x8 Hard IP
// This module wraps the Altera PCIe Hard IP core and provides a clean interface
//
// IMPORTANT: PCIe Hard IP License Unlock Required
// ================================================
// The Stratix V PCIe Gen3 x8 Hard IP requires a license from Intel/Altera,
// OR you can use the community-developed unlock patch to bypass license checks.
//
// For unlock instructions, see: fpga/pcie-3-hip-unlock/README.md
//
// Quick setup:
// - Linux: Run fpga/pcie-3-hip-unlock/linux/patch_quartus.sh
// - Windows: Run fpga/pcie-3-hip-unlock/windows/patch_quartus.ps1
//
// After patching, you can use Platform Designer to instantiate the Hard IP
// without a license. This wrapper provides a simplified interface for connecting
// the Hard IP to the DMA engine and application logic.
//
// Attribution:
// - Unlock methodology: @j-marjanovic, @ruurdk, @rombik_su
// - See: https://github.com/ruurdk/storey-peak
// - See: https://j-marjanovic.io/stratix-v-accelerator-card-from-ebay-part-8.html
//
// Implementation Notes:
// =====================
// This is currently a simulation model/stub. For actual hardware:
// 1. Generate PCIe Hard IP in Platform Designer (Qsys)
// 2. Configure: Gen3, x8, Endpoint, Avalon-ST interface
// 3. Replace the stub logic below with Platform Designer instance
// 4. Connect Avalon-ST signals to the adapter (see examples/avalon_st_adapter.v)
// 5. Use width converters to match 256-bit PCIe to 512-bit DMA data paths

module stratix_v_pcie_hip #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64
)(
    // PCIe pins
    input  wire                     pcie_refclk_p,
    input  wire                     pcie_refclk_n,
    input  wire [7:0]               pcie_rx_p,
    input  wire [7:0]               pcie_rx_n,
    output wire [7:0]               pcie_tx_p,
    output wire [7:0]               pcie_tx_n,
    input  wire                     pcie_perst_n,
    
    // Application clock and reset
    output wire                     app_clk,
    output wire                     app_rst_n,
    
    // Configuration interface
    output wire [15:0]              cfg_device_id,
    output wire [15:0]              cfg_vendor_id,
    output wire [2:0]               cfg_max_payload,
    output wire [2:0]               cfg_max_read_req,
    output wire [5:0]               cfg_bar_hit,
    
    // TLP RX interface (completion/memory write)
    output wire [DATA_WIDTH-1:0]    rx_tdata,
    output wire                     rx_tvalid,
    output wire                     rx_tlast,
    output wire [31:0]              rx_tuser,
    input  wire                     rx_tready,
    
    // TLP TX interface (memory read/write requests)
    input  wire [DATA_WIDTH-1:0]    tx_tdata,
    input  wire                     tx_tvalid,
    input  wire                     tx_tlast,
    input  wire [31:0]              tx_tuser,
    output wire                     tx_tready,
    
    // BAR access interface (memory mapped)
    output wire [ADDR_WIDTH-1:0]    bar_addr,
    output wire [DATA_WIDTH-1:0]    bar_wr_data,
    output wire [31:0]              bar_wr_be,
    output wire                     bar_wr_en,
    output wire                     bar_rd_en,
    input  wire [DATA_WIDTH-1:0]    bar_rd_data,
    input  wire                     bar_rd_valid,
    
    // MSI/MSI-X interface
    input  wire                     msi_req,
    input  wire [7:0]               msi_vector,
    output wire                     msi_ack,
    
    // Status
    output wire                     link_up,
    output wire [3:0]               link_width,
    output wire [2:0]               link_speed
);

    wire pcie_refclk;
    wire coreclkout_hip;
    
    // Clock and reset
    reg app_clk_reg;
    reg [3:0] clk_div_counter;
    
    always @(posedge pcie_refclk_p or negedge pcie_perst_n) begin
        if (!pcie_perst_n) begin
            clk_div_counter <= 4'd0;
            app_clk_reg <= 1'b0;
        end else begin
            if (clk_div_counter == 4'd1) begin
                app_clk_reg <= ~app_clk_reg;
                clk_div_counter <= 4'd0;
            end else begin
                clk_div_counter <= clk_div_counter + 1'b1;
            end
        end
    end
    
    assign app_clk = app_clk_reg;
    
    // Reset synchronization
    reg [3:0] rst_sync;
    always @(posedge app_clk or negedge pcie_perst_n) begin
        if (!pcie_perst_n)
            rst_sync <= 4'h0;
        else
            rst_sync <= {rst_sync[2:0], 1'b1};
    end
    assign app_rst_n = rst_sync[3];
    
    // Configuration
    assign cfg_device_id = 16'h5A5A;
    assign cfg_vendor_id = 16'h1172;
    assign cfg_max_payload = 3'd5;
    assign cfg_max_read_req = 3'd5;
    
    // Link status
    reg link_up_reg = 1'b1;
    reg [3:0] link_width_reg = 4'd8;
    reg [2:0] link_speed_reg = 3'd3;
    
    assign link_up = link_up_reg;
    assign link_width = link_width_reg;
    assign link_speed = link_speed_reg;
    
    // TLP processing (simplified model)
    reg [DATA_WIDTH-1:0] rx_tdata_reg;
    reg rx_tvalid_reg;
    reg rx_tlast_reg;
    reg [31:0] rx_tuser_reg;
    reg tx_tready_reg;
    reg [ADDR_WIDTH-1:0] bar_addr_reg;
    reg [DATA_WIDTH-1:0] bar_wr_data_reg;
    reg [31:0] bar_wr_be_reg;
    reg bar_wr_en_reg;
    reg bar_rd_en_reg;
    reg [5:0] cfg_bar_hit_reg;
    reg msi_ack_reg;
    
    always @(posedge app_clk or negedge app_rst_n) begin
        if (!app_rst_n) begin
            rx_tdata_reg <= {DATA_WIDTH{1'b0}};
            rx_tvalid_reg <= 1'b0;
            rx_tlast_reg <= 1'b0;
            rx_tuser_reg <= 32'h0;
            tx_tready_reg <= 1'b1;
            bar_addr_reg <= {ADDR_WIDTH{1'b0}};
            bar_wr_data_reg <= {DATA_WIDTH{1'b0}};
            bar_wr_be_reg <= 32'h0;
            bar_wr_en_reg <= 1'b0;
            bar_rd_en_reg <= 1'b0;
            cfg_bar_hit_reg <= 6'b000001;
            msi_ack_reg <= 1'b0;
        end else begin
            bar_wr_en_reg <= 1'b0;
            bar_rd_en_reg <= 1'b0;
            msi_ack_reg <= msi_req;
        end
    end
    
    assign rx_tdata = rx_tdata_reg;
    assign rx_tvalid = rx_tvalid_reg;
    assign rx_tlast = rx_tlast_reg;
    assign rx_tuser = rx_tuser_reg;
    assign tx_tready = tx_tready_reg;
    assign bar_addr = bar_addr_reg;
    assign bar_wr_data = bar_wr_data_reg;
    assign bar_wr_be = bar_wr_be_reg;
    assign bar_wr_en = bar_wr_en_reg;
    assign bar_rd_en = bar_rd_en_reg;
    assign cfg_bar_hit = cfg_bar_hit_reg;
    assign msi_ack = msi_ack_reg;
    
    // PCIe pins
    assign pcie_tx_p = 8'hFF;
    assign pcie_tx_n = 8'h00;

endmodule
endmodule
```
