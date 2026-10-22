---
title: "PCIe HIP Wrapper Example — pcie_hip_wrapper.v"
description: "Reference instantiation of the unlocked Stratix V PCIe Gen3 x8 Hard IP core."
part: "Part II — Component Library"
chapter: "PCIe & HIP Unlock Components"
category: "PCIe & HIP Unlock Components"
filename: "pcie-3-hip-unlock/examples/pcie_hip_wrapper.v"
order: 100
tags: ["PCIe & HIP Unlock Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/pcie_hip_wrapper.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/pcie-3-hip-unlock/examples/pcie_hip_wrapper.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# PCIe HIP Wrapper Example — pcie_hip_wrapper.v

**Filename:** `pcie-3-hip-unlock/examples/pcie_hip_wrapper.v`

## Description

Example wrapper for a Platform Designer-generated Stratix V PCIe HIP instance, exposing Avalon-ST RX/TX interfaces, configuration outputs, MSI hooks, and link-state signals.

## Integration Points

- Reference integration module for HIP unlock and Platform Designer handoff
- Connects generated HIP core to application-level packet/transaction pipelines
- Useful template for wiring clock/reset, LTSSM visibility, and transport signals

## README Integration Notes

This wrapper is directly tied to the `pcie-3-hip-unlock` flow documented in the parent README:

- Intended for Stratix V Gen3 x8 Hard IP integration through Platform Designer
- Assumes unlock/patch workflow has been applied before attempting licensed Hard IP generation in unsupported environments
- Serves as a handoff template for Avalon-ST RX/TX + MSI/MSI-X + config-space signal wiring

Practical sequencing from the README:

1. Apply Quartus patch workflow (Linux/Windows) where needed
2. Generate Hard IP in Platform Designer with target link/data settings
3. Replace stub/example internals with generated instance
4. Validate link training and host enumeration before DMA datapath bring-up

References:

- [`../../pcie-3-hip-unlock/README.md`](../../pcie-3-hip-unlock/README.md)
- [`../../pcie-3-hip-unlock/linux/README.md`](../../pcie-3-hip-unlock/linux/README.md)
- [`../../pcie-3-hip-unlock/windows/README.md`](../../pcie-3-hip-unlock/windows/README.md)

## Verilog Source

```verilog
module pcie_hip_wrapper #(
    parameter DATA_WIDTH = 256,
    parameter ADDR_WIDTH = 64,
    parameter NUM_BARS = 6,
    parameter VENDOR_ID = 16'h1172,
    parameter DEVICE_ID = 16'h5A5A
)(
    input  wire                     pcie_refclk,
    input  wire                     pcie_rst_n,
    input  wire [7:0]               pcie_rx_p,
    input  wire [7:0]               pcie_rx_n,
    output wire [7:0]               pcie_tx_p,
    output wire [7:0]               pcie_tx_n,
    output wire                     coreclk,
    output wire                     app_rst_n,
    output wire [DATA_WIDTH-1:0]    rx_st_data,
    input  wire [DATA_WIDTH-1:0]    tx_st_data
);
// PCIe Hard IP Wrapper Example
// Wraps Quartus Platform Designer-generated Stratix V PCIe Hard IP
// Provides a simplified TLP interface for application logic

module pcie_hip_wrapper #(
    parameter DATA_WIDTH = 256,        // Avalon-ST data width (256-bit for Gen3 x8)
    parameter ADDR_WIDTH = 64,         // Address width
    parameter NUM_BARS = 6,            // Number of BARs to support
    parameter VENDOR_ID = 16'h1172,    // Altera vendor ID
    parameter DEVICE_ID = 16'h5A5A,    // Device ID
    parameter SUBSYSTEM_VENDOR_ID = 16'h0000,
    parameter SUBSYSTEM_ID = 16'h0001,
    parameter CLASS_CODE = 24'hFF0000, // Unclassified device
    parameter REVISION_ID = 8'h01
)(
    // PCIe physical interface
    input  wire                     pcie_refclk,      // 100 MHz reference clock (single-ended)
    input  wire                     pcie_rst_n,       // PCIe fundamental reset (PERST#)
    input  wire [7:0]               pcie_rx_p,        // PCIe RX lanes (positive)
    input  wire [7:0]               pcie_rx_n,        // PCIe RX lanes (negative)
    output wire [7:0]               pcie_tx_p,        // PCIe TX lanes (positive)
    output wire [7:0]               pcie_tx_n,        // PCIe TX lanes (negative)
    
    // Application clock and reset (from PCIe Hard IP)
    output wire                     coreclk,          // Core clock output (~250 MHz for Gen3)
    output wire                     app_rst_n,        // Application reset (synchronized to coreclk)
    
    // Configuration space interface
    output wire [15:0]              cfg_vendor_id,
    output wire [15:0]              cfg_device_id,
    output wire [2:0]               cfg_max_payload,   // Encoded: 000=128B, 101=4096B
    output wire [2:0]               cfg_max_read_req,
    output wire [7:0]               cfg_bus_num,
    output wire [4:0]               cfg_dev_num,
    output wire [2:0]               cfg_func_num,
    
    // RX TLP interface (PCIe → Application)
    output wire [DATA_WIDTH-1:0]    rx_st_data,       // RX data
    output wire                     rx_st_valid,      // RX data valid
    output wire                     rx_st_sop,        // Start of packet
    output wire                     rx_st_eop,        // End of packet
    output wire [1:0]               rx_st_empty,      // Empty bytes in last beat
    output wire [7:0]               rx_st_bardec,     // BAR decode (one-hot)
    input  wire                     rx_st_ready,      // Application ready
    output wire                     rx_st_err,        // RX error
    
    // TX TLP interface (Application → PCIe)
    input  wire [DATA_WIDTH-1:0]    tx_st_data,       // TX data
    input  wire                     tx_st_valid,      // TX data valid
    input  wire                     tx_st_sop,        // Start of packet
    input  wire                     tx_st_eop,        // End of packet
    input  wire [1:0]               tx_st_empty,      // Empty bytes in last beat
    output wire                     tx_st_ready,      // Hard IP ready
    output wire                     tx_st_err,        // TX error
    
    // Interrupt interface (MSI/MSI-X)
    input  wire                     app_msi_req,      // MSI request
    input  wire [4:0]               app_msi_num,      // MSI vector number (0-31)
    output wire                     app_msi_ack,      // MSI acknowledged
    input  wire [2:0]               app_msi_tc,       // Traffic class (typically 0)
    
    // Status and control
    output wire                     link_up,          // Link is up (L0 state)
    output wire [3:0]               link_width,       // Negotiated link width (1/2/4/8)
    output wire [1:0]               link_speed,       // 00=Gen1, 01=Gen2, 10=Gen3
    output wire [4:0]               ltssm_state,      // LTSSM state machine state
    output wire [7:0]               lane_act,         // Active lanes mask
    
    // Error reporting
    output wire                     serr_out,         // System error
    output wire [31:0]              aer_msi_num,      // AER MSI vector
    output wire                     pex_msi_num       // PEX MSI vector
);

    // ========================================================================
    // Platform Designer Generated Instantiation
    // ========================================================================
    // This is where you would instantiate the Platform Designer-generated
    // Stratix V PCIe Hard IP component. The exact instance name and ports
    // depend on your Platform Designer configuration.
    //
    // Example (you'll need to replace this with your actual generated module):
    //
    // pcie_hip_qsys u_pcie_hip (
    //     .pcie_rstn(pcie_rst_n),
    //     .refclk_clk(pcie_refclk),
    //     .hip_serial_rx_in(pcie_rx_p),  // Platform Designer may handle diff pairs
    //     .hip_serial_tx_out(pcie_tx_p),
    //     .coreclkout_hip(coreclk),
    //     .reset_status_reset_n(app_rst_n),
    //     
    //     // Avalon-ST RX
    //     .rx_st_data(rx_st_data),
    //     .rx_st_valid(rx_st_valid),
    //     .rx_st_ready(rx_st_ready),
    //     .rx_st_sop(rx_st_sop),
    //     .rx_st_eop(rx_st_eop),
    //     .rx_st_empty(rx_st_empty),
    //     .rx_st_bardec(rx_st_bardec),
    //     
    //     // Avalon-ST TX
    //     .tx_st_data(tx_st_data),
    //     .tx_st_valid(tx_st_valid),
    //     .tx_st_ready(tx_st_ready),
    //     .tx_st_sop(tx_st_sop),
    //     .tx_st_eop(tx_st_eop),
    //     .tx_st_empty(tx_st_empty),
    //     
    //     // ... other signals
    // );
    
    // ========================================================================
    // For this example, we'll create a simplified stub
    // Replace this with actual Platform Designer instantiation
    // ========================================================================
    
    // Clock generation (simplified - actual IP provides this)
    reg coreclk_reg = 1'b0;
    always #2ns coreclk_reg = ~coreclk_reg;  // ~250 MHz
    assign coreclk = coreclk_reg;
    
    // Reset synchronization
    reg [3:0] rst_sync = 4'h0;
    always @(posedge coreclk or negedge pcie_rst_n) begin
        if (!pcie_rst_n)
            rst_sync <= 4'h0;
        else
            rst_sync <= {rst_sync[2:0], 1'b1};
    end
    assign app_rst_n = rst_sync[3];
    
    // Configuration space (would come from Hard IP)
    assign cfg_vendor_id = VENDOR_ID;
    assign cfg_device_id = DEVICE_ID;
    assign cfg_max_payload = 3'd5;   // 4096 bytes
    assign cfg_max_read_req = 3'd5;
    assign cfg_bus_num = 8'd1;
    assign cfg_dev_num = 5'd0;
    assign cfg_func_num = 3'd0;
    
    // Link status (would come from Hard IP)
    reg link_up_reg = 1'b0;
    reg [3:0] link_width_reg = 4'd0;
    reg [1:0] link_speed_reg = 2'd0;
    reg [4:0] ltssm_state_reg = 5'd0;
    
    // Simple link training state machine (example)
    localparam LTSSM_DETECT     = 5'h00;
    localparam LTSSM_POLLING    = 5'h02;
    localparam LTSSM_CONFIG     = 5'h04;
    localparam LTSSM_L0         = 5'h0B;
    
    reg [7:0] link_train_counter = 0;
    
    always @(posedge coreclk or negedge app_rst_n) begin
        if (!app_rst_n) begin
            link_up_reg <= 1'b0;
            link_width_reg <= 4'd0;
            link_speed_reg <= 2'd0;
            ltssm_state_reg <= LTSSM_DETECT;
            link_train_counter <= 0;
        end else begin
            // Simplified link training
            if (link_train_counter < 100) begin
                link_train_counter <= link_train_counter + 1;
                case (link_train_counter)
                    8'd20:  ltssm_state_reg <= LTSSM_POLLING;
                    8'd40:  ltssm_state_reg <= LTSSM_CONFIG;
                    8'd60:  begin
                        ltssm_state_reg <= LTSSM_L0;
                        link_up_reg <= 1'b1;
                        link_width_reg <= 4'd8;  // x8
                        link_speed_reg <= 2'd2;  // Gen3
                    end
                endcase
            end
        end
    end
    
    assign link_up = link_up_reg;
    assign link_width = link_width_reg;
    assign link_speed = link_speed_reg;
    assign ltssm_state = ltssm_state_reg;
    assign lane_act = 8'hFF;  // All lanes active
    
    // RX/TX interfaces (stubbed - would be driven by Hard IP)
    assign rx_st_data = {DATA_WIDTH{1'b0}};
    assign rx_st_valid = 1'b0;
    assign rx_st_sop = 1'b0;
    assign rx_st_eop = 1'b0;
    assign rx_st_empty = 2'd0;
    assign rx_st_bardec = 8'd0;
    assign rx_st_err = 1'b0;
    
    assign tx_st_ready = 1'b1;
    assign tx_st_err = 1'b0;
    
    // MSI interface (stubbed)
    assign app_msi_ack = app_msi_req;
    
    // Error reporting (stubbed)
    assign serr_out = 1'b0;
    assign aer_msi_num = 32'd0;
    assign pex_msi_num = 1'b0;
    
    // PCIe physical pins (stubbed - driven by Hard IP transceivers)
    assign pcie_tx_p = 8'hFF;
    assign pcie_tx_n = 8'h00;
    
    // ========================================================================
    // Integration Notes
    // ========================================================================
    //
    // To use this wrapper with actual Stratix V Hard IP:
    //
    // 1. Generate the Hard IP in Platform Designer
    // 2. Configure as: Gen3, x8, Endpoint, Avalon-ST interface
    // 3. Generate HDL
    // 4. Replace the stub logic above with the actual Platform Designer instance
    // 5. Connect all signals appropriately
    // 6. Ensure clock crossing is handled (if Hard IP clock differs from app clock)
    //
    // The wrapper provides a clean interface that can be used in fpga_top.v
    // and connected to the DMA engine via width converters.
    //
    // ========================================================================

endmodule
endmodule
```
