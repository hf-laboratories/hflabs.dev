---
title: "Ethernet Timestamp Unit — ethernet_timestamp_unit.sv"
description: "Hardware MAC layer packet parser capturing ingress and egress timestamps with latency correction."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/ethernet_timestamp_unit.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/ethernet_timestamp_unit.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/ethernet_timestamp_unit.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Ethernet Timestamp Unit — ethernet_timestamp_unit.sv

**Filename:** `timing/ethernet_timestamp_unit.sv`

## Description

Captures hardware TX/RX timestamps for PTP traffic, detects PTP EtherType frames, and applies configurable TX/RX path delay compensation with CDC-safe handshakes.

## Integration Points

- Interfaces between PHC time domain and Ethernet MAC TX/RX domains
- Uses CDC synchronizers/pulse synchronizers to safely transfer capture events
- Supplies compensated timestamps for protocol-level PTP processing and diagnostics

## Verilog Source

```verilog
module ethernet_timestamp_unit #(
    parameter PHC_WIDTH = 80,
    parameter DATA_WIDTH = 512,
    parameter TX_PATH_DELAY_NS = 80,
    parameter RX_PATH_DELAY_NS = 80
)(
    input  wire clk_phc,
    input  wire rst_n,
    input  wire [PHC_WIDTH-1:0] phc_timestamp,
    input  wire clk_eth_tx,
    input  wire eth_tx_sop,
    input  wire [DATA_WIDTH-1:0] eth_tx_data,
    output reg  [PHC_WIDTH-1:0] tx_timestamp,
    output reg  [PHC_WIDTH-1:0] rx_timestamp
);
// Ethernet Timestamp Unit
// Captures hardware timestamps at TX/RX packet boundaries for PTP messages
// Detects PTP packets and applies path delay compensation

module ethernet_timestamp_unit #(
    parameter PHC_WIDTH = 80,
    parameter DATA_WIDTH = 512,
    parameter TX_PATH_DELAY_NS = 80,   // MAC/PHY TX pipeline delay
    parameter RX_PATH_DELAY_NS = 80    // MAC/PHY RX pipeline delay
)(
    input  wire                     clk_phc,
    input  wire                     rst_n,
    
    // PHC timestamp input
    input  wire [PHC_WIDTH-1:0]     phc_timestamp,
    
    // TX Ethernet interface (156.25MHz or 250MHz clock domain)
    input  wire                     clk_eth_tx,
    input  wire                     eth_tx_sop,
    input  wire                     eth_tx_eop,
    input  wire                     eth_tx_valid,
    input  wire [DATA_WIDTH-1:0]    eth_tx_data,
    
    // TX timestamp output
    output reg  [PHC_WIDTH-1:0]     tx_timestamp,
    output reg                      tx_timestamp_valid,
    output reg                      ptp_tx_detected,
    
    // RX Ethernet interface
    input  wire                     clk_eth_rx,
    input  wire                     eth_rx_sop,
    input  wire                     eth_rx_eop,
    input  wire                     eth_rx_valid,
    input  wire [DATA_WIDTH-1:0]    eth_rx_data,
    
    // RX timestamp output
    output reg  [PHC_WIDTH-1:0]     rx_timestamp,
    output reg                      rx_timestamp_valid,
    output reg                      ptp_rx_detected
);

    // PTP EtherType = 0x88F7
    localparam [15:0] PTP_ETHERTYPE = 16'h88F7;
    
    //=========================================================================
    // TX Path
    //=========================================================================
    
    // Detect PTP packets on TX path (in TX clock domain)
    reg tx_ptp_detected;
    reg tx_capture_timestamp;
    reg [PHC_WIDTH-1:0] tx_timestamp_captured;
    
    always @(posedge clk_eth_tx or negedge rst_n) begin
        if (!rst_n) begin
            tx_ptp_detected <= 1'b0;
            tx_capture_timestamp <= 1'b0;
            ptp_tx_detected <= 1'b0;
        end else begin
            tx_capture_timestamp <= 1'b0;
            ptp_tx_detected <= 1'b0;
            
            if (eth_tx_sop && eth_tx_valid) begin
                // Check EtherType at byte offset 12-13 in first 64 bytes
                // For 512-bit (64-byte) data width, EtherType is in bits [111:96]
                // (byte 12-13 from start of packet)
                if (eth_tx_data[111:96] == PTP_ETHERTYPE) begin
                    tx_ptp_detected <= 1'b1;
                    tx_capture_timestamp <= 1'b1;
                    ptp_tx_detected <= 1'b1;
                end
            end
        end
    end
    
    // Capture PHC timestamp and cross to TX clock domain
    reg [PHC_WIDTH-1:0] phc_snapshot_tx;
    reg phc_snapshot_valid_tx;
    
    // Use handshake CDC for timestamp transfer
    wire tx_req_phc;
    wire tx_ack_phc;
    
    // Request pulse in TX domain
    cdc_pulse_sync u_tx_req_cdc (
        .src_clk(clk_eth_tx),
        .src_rst_n(rst_n),
        .src_pulse(tx_capture_timestamp),
        .dst_clk(clk_phc),
        .dst_rst_n(rst_n),
        .dst_pulse(tx_req_phc)
    );
    
    // Capture timestamp in PHC domain
    reg [PHC_WIDTH-1:0] phc_tx_latched;
    reg phc_tx_ack;
    
    always @(posedge clk_phc or negedge rst_n) begin
        if (!rst_n) begin
            phc_tx_latched <= {PHC_WIDTH{1'b0}};
            phc_tx_ack <= 1'b0;
        end else begin
            if (tx_req_phc) begin
                // Add TX path delay compensation
                phc_tx_latched <= phc_timestamp + TX_PATH_DELAY_NS;
                phc_tx_ack <= 1'b1;
            end else begin
                phc_tx_ack <= 1'b0;
            end
        end
    end
    
    // Acknowledge back to TX domain
    cdc_pulse_sync u_tx_ack_cdc (
        .src_clk(clk_phc),
        .src_rst_n(rst_n),
        .src_pulse(phc_tx_ack),
        .dst_clk(clk_eth_tx),
        .dst_rst_n(rst_n),
        .dst_pulse(tx_ack_phc)
    );
    
    // Transfer timestamp data using synchronizer
    cdc_sync #(
        .WIDTH(PHC_WIDTH),
        .STAGES(3)
    ) u_tx_timestamp_cdc (
        .dst_clk(clk_eth_tx),
        .dst_rst_n(rst_n),
        .src_data(phc_tx_latched),
        .dst_data(tx_timestamp_captured)
    );
    
    // Output TX timestamp
    always @(posedge clk_eth_tx or negedge rst_n) begin
        if (!rst_n) begin
            tx_timestamp <= {PHC_WIDTH{1'b0}};
            tx_timestamp_valid <= 1'b0;
        end else begin
            tx_timestamp_valid <= 1'b0;
            
            if (tx_ack_phc) begin
                tx_timestamp <= tx_timestamp_captured;
                tx_timestamp_valid <= 1'b1;
            end
        end
    end
    
    //=========================================================================
    // RX Path
    //=========================================================================
    
    // Detect PTP packets on RX path (in RX clock domain)
    reg rx_ptp_detected;
    reg rx_capture_timestamp;
    reg [PHC_WIDTH-1:0] rx_timestamp_captured;
    
    always @(posedge clk_eth_rx or negedge rst_n) begin
        if (!rst_n) begin
            rx_ptp_detected <= 1'b0;
            rx_capture_timestamp <= 1'b0;
            ptp_rx_detected <= 1'b0;
        end else begin
            rx_capture_timestamp <= 1'b0;
            ptp_rx_detected <= 1'b0;
            
            if (eth_rx_sop && eth_rx_valid) begin
                // Check EtherType at byte offset 12-13
                if (eth_rx_data[111:96] == PTP_ETHERTYPE) begin
                    rx_ptp_detected <= 1'b1;
                    rx_capture_timestamp <= 1'b1;
                    ptp_rx_detected <= 1'b1;
                end
            end
        end
    end
    
    // Capture PHC timestamp and cross to RX clock domain
    wire rx_req_phc;
    wire rx_ack_phc;
    
    // Request pulse in RX domain
    cdc_pulse_sync u_rx_req_cdc (
        .src_clk(clk_eth_rx),
        .src_rst_n(rst_n),
        .src_pulse(rx_capture_timestamp),
        .dst_clk(clk_phc),
        .dst_rst_n(rst_n),
        .dst_pulse(rx_req_phc)
    );
    
    // Capture timestamp in PHC domain
    reg [PHC_WIDTH-1:0] phc_rx_latched;
    reg phc_rx_ack;
    
    always @(posedge clk_phc or negedge rst_n) begin
        if (!rst_n) begin
            phc_rx_latched <= {PHC_WIDTH{1'b0}};
            phc_rx_ack <= 1'b0;
        end else begin
            if (rx_req_phc) begin
                // Subtract RX path delay compensation
                phc_rx_latched <= phc_timestamp - RX_PATH_DELAY_NS;
                phc_rx_ack <= 1'b1;
            end else begin
                phc_rx_ack <= 1'b0;
            end
        end
    end
    
    // Acknowledge back to RX domain
    cdc_pulse_sync u_rx_ack_cdc (
        .src_clk(clk_phc),
        .src_rst_n(rst_n),
        .src_pulse(phc_rx_ack),
        .dst_clk(clk_eth_rx),
        .dst_rst_n(rst_n),
        .dst_pulse(rx_ack_phc)
    );
    
    // Transfer timestamp data using synchronizer
    cdc_sync #(
        .WIDTH(PHC_WIDTH),
        .STAGES(3)
    ) u_rx_timestamp_cdc (
        .dst_clk(clk_eth_rx),
        .dst_rst_n(rst_n),
        .src_data(phc_rx_latched),
        .dst_data(rx_timestamp_captured)
    );
    
    // Output RX timestamp
    always @(posedge clk_eth_rx or negedge rst_n) begin
        if (!rst_n) begin
            rx_timestamp <= {PHC_WIDTH{1'b0}};
            rx_timestamp_valid <= 1'b0;
        end else begin
            rx_timestamp_valid <= 1'b0;
            
            if (rx_ack_phc) begin
                rx_timestamp <= rx_timestamp_captured;
                rx_timestamp_valid <= 1'b1;
            end
        end
    end

endmodule
endmodule
```
