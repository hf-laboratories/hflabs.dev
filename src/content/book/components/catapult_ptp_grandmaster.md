---
title: "Catapult PTP Grandmaster — catapult_ptp_grandmaster.sv"
description: "IEEE 1588 PTPv2 grandmaster integrating GPS, PHC counter, OCXO discipline loop, and Ethernet timestamping."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/catapult_ptp_grandmaster.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/catapult_ptp_grandmaster.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/catapult_ptp_grandmaster.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Catapult PTP Grandmaster — catapult_ptp_grandmaster.sv

**Filename:** `timing/catapult_ptp_grandmaster.sv`

## Description

Top-level IEEE 1588 PTPv2 grandmaster integration module that ties together GPS ingress, PHC, OCXO discipline loop, Ethernet timestamping, and PCIe BAR control/status plumbing.

## Integration Points

- Integrates `lea_m8t_interface`, `ptp_hardware_clock`, `ocxo_discipline_loop`, `ethernet_timestamp_unit`, and `pcie_bar_registers`
- Bridges OCXO/GPS timing references into synchronized PHC and network timestamp domains
- Exposes host software control and telemetry via PCIe BAR register interface

## Verilog Source

```verilog
module catapult_ptp_grandmaster #(
    parameter OCXO_FREQ_HZ = 10_000_000,
    parameter PHC_WIDTH = 80,
    parameter DAC_WIDTH = 16,
    parameter ETH_DATA_WIDTH = 512
)(
    input  wire clk_ocxo_10mhz,
    input  wire clk_pcie,
    input  wire clk_eth_tx,
    input  wire clk_eth_rx,
    input  wire rst_n,
    input  wire gps_1pps,
    input  wire gps_uart_rx,
    output wire gps_uart_tx,
    output wire [DAC_WIDTH-1:0] ocxo_dac
);
// Catapult PTP Grandmaster Top-Level Module
// Integrates GPS interface, discipline loop, PHC, TSU, and PCIe registers
// for IEEE 1588-2008 PTPv2 Grandmaster clock implementation

module catapult_ptp_grandmaster #(
    parameter OCXO_FREQ_HZ = 10_000_000,
    parameter PHC_WIDTH = 80,
    parameter DAC_WIDTH = 16,
    parameter ETH_DATA_WIDTH = 512
)(
    // Clock inputs
    input  wire                         clk_ocxo_10mhz,
    input  wire                         clk_pcie,
    input  wire                         clk_eth_tx,
    input  wire                         clk_eth_rx,
    input  wire                         rst_n,
    
    // GPS interface
    input  wire                         gps_1pps,
    input  wire                         gps_uart_rx,
    output wire                         gps_uart_tx,
    input  wire                         gps_timepulse,
    
    // OCXO control
    output wire [DAC_WIDTH-1:0]         ocxo_dac,
    output wire                         ocxo_enable,
    
    // Ethernet TX interface
    input  wire                         eth_tx_sop,
    input  wire                         eth_tx_eop,
    input  wire                         eth_tx_valid,
    input  wire [ETH_DATA_WIDTH-1:0]    eth_tx_data,
    output wire [PHC_WIDTH-1:0]         eth_tx_timestamp,
    output wire                         eth_tx_timestamp_valid,
    
    // Ethernet RX interface
    input  wire                         eth_rx_sop,
    input  wire                         eth_rx_eop,
    input  wire                         eth_rx_valid,
    input  wire [ETH_DATA_WIDTH-1:0]    eth_rx_data,
    output wire [PHC_WIDTH-1:0]         eth_rx_timestamp,
    output wire                         eth_rx_timestamp_valid,
    
    // PCIe BAR interface
    input  wire [15:0]                  pcie_bar_address,
    input  wire                         pcie_bar_read,
    output wire [31:0]                  pcie_bar_readdata,
    output wire                         pcie_bar_readdatavalid,
    input  wire                         pcie_bar_write,
    input  wire [31:0]                  pcie_bar_writedata,
    input  wire [3:0]                   pcie_bar_byteenable,
    output wire                         pcie_bar_waitrequest,
    
    // Status outputs
    output wire                         ptp_locked,
    output wire                         gps_locked,
    output wire [7:0]                   gps_satellites,
    output wire [7:0]                   status_leds
);

    //=========================================================================
    // Clock Generation from OCXO
    //=========================================================================
    // IMPORTANT: In a real implementation, this must use Stratix V IOPLL
    // to generate 250MHz PHC clock and 1GHz sub-nanosecond clock from 10MHz OCXO
    // 
    // Quartus example:
    //   altera_pll #(
    //     .reference_clock_frequency("10.0 MHz"),
    //     .output_clock_frequency0("250.0 MHz"),
    //     .output_clock_frequency1("1000.0 MHz")
    //   ) ocxo_pll (
    //     .refclk(clk_ocxo_10mhz),
    //     .outclk_0(clk_phc_250mhz),
    //     .outclk_1(clk_phc_1ghz),
    //     .locked(pll_locked)
    //   );
    //
    // The simplified assignments below are FOR SIMULATION/TESTING ONLY
    // and will NOT work correctly in hardware.
    
    wire clk_phc_250mhz;
    wire clk_phc_1ghz;
    wire pll_locked;
    
    // Placeholder assignments for simulation (REPLACE WITH PLL FOR HARDWARE!)
    assign clk_phc_250mhz = clk_ocxo_10mhz;
    assign clk_phc_1ghz = clk_ocxo_10mhz;
    assign pll_locked = 1'b1;
    
    //=========================================================================
    // GPS Interface
    //=========================================================================
    wire gps_locked_int;
    wire [7:0] gps_satellites_int;
    wire [47:0] gps_utc_seconds;
    wire [PHC_WIDTH-1:0] pps_timestamp;
    wire pps_timestamp_valid;
    wire survey_mode_enable;
    wire [31:0] survey_duration_sec;
    
    lea_m8t_interface #(
        .CLK_FREQ_HZ(250_000_000),  // PHC clock frequency
        .BAUD_RATE(115200),
        .PHC_WIDTH(PHC_WIDTH)
    ) u_gps_interface (
        .clk(clk_phc_250mhz),
        .rst_n(rst_n && pll_locked),
        .gps_1pps(gps_1pps),
        .gps_uart_rx(gps_uart_rx),
        .gps_uart_tx(gps_uart_tx),
        .gps_timepulse(gps_timepulse),
        .phc_timestamp(phc_timestamp_int),
        .gps_locked(gps_locked_int),
        .gps_satellites(gps_satellites_int),
        .gps_utc_seconds(gps_utc_seconds),
        .pps_timestamp(pps_timestamp),
        .pps_timestamp_valid(pps_timestamp_valid),
        .survey_mode_enable(survey_mode_enable),
        .survey_duration_sec(survey_duration_sec)
    );
    
    //=========================================================================
    // PTP Hardware Clock
    //=========================================================================
    wire [PHC_WIDTH-1:0] phc_timestamp_int;
    wire [47:0] phc_seconds;
    wire [31:0] phc_nanoseconds;
    wire [47:0] adj_seconds;
    wire [31:0] adj_nanoseconds;
    wire adj_add;
    wire adj_trigger;
    wire signed [31:0] freq_adj_ppb;
    wire freq_adj_valid;
    wire signed [31:0] discipline_ns;
    wire discipline_valid;
    wire gps_time_set;
    
    ptp_hardware_clock #(
        .PHC_WIDTH(PHC_WIDTH),
        .CLK_FREQ_HZ(250_000_000)
    ) u_phc (
        .clk(clk_phc_250mhz),
        .rst_n(rst_n && pll_locked),
        .clk_1ghz(clk_phc_1ghz),
        .phc_timestamp(phc_timestamp_int),
        .phc_seconds(phc_seconds),
        .phc_nanoseconds(phc_nanoseconds),
        .adj_seconds(adj_seconds),
        .adj_nanoseconds(adj_nanoseconds),
        .adj_add(adj_add),
        .adj_trigger(adj_trigger),
        .freq_adj_ppb(freq_adj_ppb),
        .freq_adj_valid(freq_adj_valid),
        .discipline_ns(discipline_ns),
        .discipline_valid(discipline_valid),
        .gps_utc_seconds(gps_utc_seconds),
        .gps_time_set(gps_time_set)
    );
    
    //=========================================================================
    // OCXO Discipline Loop
    //=========================================================================
    wire discipline_locked;
    wire signed [31:0] phase_error_ns;
    wire [31:0] discipline_kp;
    wire [31:0] discipline_ki;
    wire holdover_enable;
    
    ocxo_discipline_loop #(
        .DAC_WIDTH(DAC_WIDTH),
        .PHC_WIDTH(PHC_WIDTH)
    ) u_discipline_loop (
        .clk(clk_phc_250mhz),
        .rst_n(rst_n && pll_locked),
        .pps_timestamp_valid(pps_timestamp_valid),
        .pps_timestamp(pps_timestamp),
        .gps_locked(gps_locked_int),
        .pi_kp(discipline_kp),
        .pi_ki(discipline_ki),
        .ocxo_dac(ocxo_dac),
        .ocxo_enable(ocxo_enable),
        .discipline_ns(discipline_ns),
        .discipline_valid(discipline_valid),
        .discipline_locked(discipline_locked),
        .phase_error_ns(phase_error_ns),
        .holdover_enable(holdover_enable)
    );
    
    //=========================================================================
    // Ethernet Timestamp Unit
    //=========================================================================
    wire ptp_tx_detected;
    wire ptp_rx_detected;
    
    ethernet_timestamp_unit #(
        .PHC_WIDTH(PHC_WIDTH),
        .DATA_WIDTH(ETH_DATA_WIDTH),
        .TX_PATH_DELAY_NS(80),
        .RX_PATH_DELAY_NS(80)
    ) u_timestamp_unit (
        .clk_phc(clk_phc_250mhz),
        .rst_n(rst_n && pll_locked),
        .phc_timestamp(phc_timestamp_int),
        .clk_eth_tx(clk_eth_tx),
        .eth_tx_sop(eth_tx_sop),
        .eth_tx_eop(eth_tx_eop),
        .eth_tx_valid(eth_tx_valid),
        .eth_tx_data(eth_tx_data),
        .tx_timestamp(eth_tx_timestamp),
        .tx_timestamp_valid(eth_tx_timestamp_valid),
        .ptp_tx_detected(ptp_tx_detected),
        .clk_eth_rx(clk_eth_rx),
        .eth_rx_sop(eth_rx_sop),
        .eth_rx_eop(eth_rx_eop),
        .eth_rx_valid(eth_rx_valid),
        .eth_rx_data(eth_rx_data),
        .rx_timestamp(eth_rx_timestamp),
        .rx_timestamp_valid(eth_rx_timestamp_valid),
        .ptp_rx_detected(ptp_rx_detected)
    );
    
    //=========================================================================
    // PCIe BAR Registers
    //=========================================================================
    pcie_bar_registers #(
        .PHC_WIDTH(PHC_WIDTH),
        .DAC_WIDTH(DAC_WIDTH)
    ) u_bar_registers (
        .clk(clk_pcie),
        .rst_n(rst_n),
        .bar_address(pcie_bar_address),
        .bar_read(pcie_bar_read),
        .bar_readdata(pcie_bar_readdata),
        .bar_readdatavalid(pcie_bar_readdatavalid),
        .bar_write(pcie_bar_write),
        .bar_writedata(pcie_bar_writedata),
        .bar_byteenable(pcie_bar_byteenable),
        .bar_waitrequest(pcie_bar_waitrequest),
        .phc_seconds(phc_seconds),
        .phc_nanoseconds(phc_nanoseconds),
        .adj_seconds(adj_seconds),
        .adj_nanoseconds(adj_nanoseconds),
        .adj_add(adj_add),
        .adj_trigger(adj_trigger),
        .freq_adj_ppb(freq_adj_ppb),
        .freq_adj_valid(freq_adj_valid),
        .gps_locked(gps_locked_int),
        .gps_satellites(gps_satellites_int),
        .survey_mode_enable(survey_mode_enable),
        .survey_duration_sec(survey_duration_sec),
        .discipline_locked(discipline_locked),
        .phase_error_ns(phase_error_ns),
        .discipline_kp(discipline_kp),
        .discipline_ki(discipline_ki),
        .holdover_enable(holdover_enable)
    );
    
    //=========================================================================
    // GPS Time Set Logic
    //=========================================================================
    // Set PHC to GPS time on initial lock or after long GPS outage
    reg gps_locked_d1;
    reg [3:0] gps_lock_count;
    
    always @(posedge clk_phc_250mhz or negedge rst_n) begin
        if (!rst_n) begin
            gps_locked_d1 <= 1'b0;
            gps_lock_count <= 4'h0;
        end else begin
            gps_locked_d1 <= gps_locked_int;
            
            if (!gps_locked_d1 && gps_locked_int) begin
                // GPS just locked - count a few 1PPS before setting time
                gps_lock_count <= 4'h0;
            end else if (gps_locked_int && pps_timestamp_valid) begin
                if (gps_lock_count < 4'hF) begin
                    gps_lock_count <= gps_lock_count + 1;
                end
            end
        end
    end
    
    // Set PHC time after 5 valid 1PPS pulses
    assign gps_time_set = (gps_lock_count == 4'h5) && pps_timestamp_valid;
    
    //=========================================================================
    // Status Outputs
    //=========================================================================
    assign ptp_locked = discipline_locked;
    assign gps_locked = gps_locked_int;
    assign gps_satellites = gps_satellites_int;
    
    // Status LEDs
    assign status_leds = {
        ptp_locked,           // LED 7: PTP discipline locked
        gps_locked_int,       // LED 6: GPS locked
        gps_satellites_int >= 4,  // LED 5: >= 4 satellites
        ptp_tx_detected,      // LED 4: PTP TX detected
        ptp_rx_detected,      // LED 3: PTP RX detected
        pll_locked,           // LED 2: PLL locked
        1'b0,                 // LED 1: Reserved
        |gps_satellites_int   // LED 0: Any satellites
    };

endmodule
endmodule
```
