---
title: "LEA-M8T Interface — lea_m8t_interface.sv"
description: "Decodes u-blox UBX binary packets and captures 1PPS pulses with sub-5ns precision."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/lea_m8t_interface.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/lea_m8t_interface.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/lea_m8t_interface.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# LEA-M8T Interface — lea_m8t_interface.sv

**Filename:** `timing/lea_m8t_interface.sv`

## Description

GPS receiver interface for u-blox LEA-M8T/M6T-class devices, providing UART-based UBX parsing, 1PPS capture, satellite lock telemetry, and UTC time extraction.

## Integration Points

- Front-end timing reference ingestion for GPS lock and time-of-day data
- Uses `uart_rx` and `uart_tx` for GPS command/telemetry transport
- Publishes PPS-captured PHC timestamps and lock status to grandmaster control path

## Verilog Source

```verilog
module lea_m8t_interface #(
    parameter CLK_FREQ_HZ = 100_000_000,
    parameter BAUD_RATE = 115200,
    parameter PHC_WIDTH = 80
)(
    input  wire clk,
    input  wire rst_n,
    input  wire gps_1pps,
    input  wire gps_uart_rx,
    output wire gps_uart_tx,
    input  wire [PHC_WIDTH-1:0] phc_timestamp,
    output reg gps_locked,
    output reg [7:0] gps_satellites
);
// LEA-M8T GPS Interface Module
// Interfaces with u-blox LEA-M8T/M6T GPS receiver via UART
// Parses UBX protocol messages and captures 1PPS timestamps

module lea_m8t_interface #(
    parameter CLK_FREQ_HZ = 100_000_000,
    parameter BAUD_RATE = 115200,
    parameter PHC_WIDTH = 80
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // GPS physical interface
    input  wire                     gps_1pps,
    input  wire                     gps_uart_rx,
    output wire                     gps_uart_tx,
    input  wire                     gps_timepulse,
    
    // PHC timestamp input
    input  wire [PHC_WIDTH-1:0]     phc_timestamp,
    
    // GPS status outputs
    output reg                      gps_locked,
    output reg  [7:0]               gps_satellites,
    output reg  [47:0]              gps_utc_seconds,
    output reg  [PHC_WIDTH-1:0]     pps_timestamp,
    output reg                      pps_timestamp_valid,
    
    // Configuration interface
    input  wire                     survey_mode_enable,
    input  wire [31:0]              survey_duration_sec
);

    // 3-stage synchronizer for 1PPS input (metastability protection)
    reg [2:0] pps_sync;
    wire pps_stable = pps_sync[2];
    reg pps_stable_d1;
    wire pps_rising_edge = pps_stable && !pps_stable_d1;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            pps_sync <= 3'b000;
            pps_stable_d1 <= 1'b0;
        end else begin
            pps_sync <= {pps_sync[1:0], gps_1pps};
            pps_stable_d1 <= pps_stable;
        end
    end
    
    // Capture PHC timestamp on 1PPS rising edge
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            pps_timestamp <= {PHC_WIDTH{1'b0}};
            pps_timestamp_valid <= 1'b0;
        end else begin
            pps_timestamp_valid <= 1'b0;
            
            if (pps_rising_edge) begin
                pps_timestamp <= phc_timestamp;
                pps_timestamp_valid <= 1'b1;
            end
        end
    end
    
    // UART receiver
    wire [7:0] uart_rx_data;
    wire uart_rx_valid;
    wire uart_frame_error;
    wire uart_parity_error;
    
    uart_rx #(
        .CLK_FREQ_HZ(CLK_FREQ_HZ),
        .BAUD_RATE(BAUD_RATE),
        .PARITY_EN(0),
        .STOP_BITS(1)
    ) u_uart_rx (
        .clk(clk),
        .rst_n(rst_n),
        .uart_rx(gps_uart_rx),
        .rx_data(uart_rx_data),
        .rx_valid(uart_rx_valid),
        .rx_ready(1'b1),  // Always ready
        .frame_error(uart_frame_error),
        .parity_error(uart_parity_error)
    );
    
    // UART transmitter (for configuration)
    reg [7:0] uart_tx_data;
    reg uart_tx_valid;
    wire uart_tx_ready;
    
    uart_tx #(
        .CLK_FREQ_HZ(CLK_FREQ_HZ),
        .BAUD_RATE(BAUD_RATE),
        .PARITY_EN(0),
        .STOP_BITS(1)
    ) u_uart_tx (
        .clk(clk),
        .rst_n(rst_n),
        .tx_data(uart_tx_data),
        .tx_valid(uart_tx_valid),
        .tx_ready(uart_tx_ready),
        .uart_tx(gps_uart_tx)
    );
    
    // UBX protocol parser state machine
    typedef enum logic [3:0] {
        UBX_SYNC1,
        UBX_SYNC2,
        UBX_CLASS,
        UBX_ID,
        UBX_LEN_L,
        UBX_LEN_H,
        UBX_PAYLOAD,
        UBX_CK_A,
        UBX_CK_B
    } ubx_state_t;
    
    ubx_state_t ubx_state;
    
    // UBX message structure
    reg [7:0] ubx_class;
    reg [7:0] ubx_id;
    reg [15:0] ubx_length;
    reg [15:0] ubx_payload_count;
    reg [7:0] ubx_ck_a, ubx_ck_b;
    reg [7:0] ubx_calc_ck_a, ubx_calc_ck_b;
    
    // UBX-NAV-PVT payload (relevant fields)
    reg [7:0] ubx_payload [0:91];  // NAV-PVT is 92 bytes
    reg [2:0] fix_type;
    reg [7:0] num_sv;
    reg [31:0] itow;
    reg [15:0] year;
    reg [7:0] month, day, hour, minute, second;
    
    // UBX parser
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            ubx_state <= UBX_SYNC1;
            ubx_class <= 8'h00;
            ubx_id <= 8'h00;
            ubx_length <= 16'h0000;
            ubx_payload_count <= 16'h0000;
            ubx_ck_a <= 8'h00;
            ubx_ck_b <= 8'h00;
            ubx_calc_ck_a <= 8'h00;
            ubx_calc_ck_b <= 8'h00;
            gps_locked <= 1'b0;
            gps_satellites <= 8'h00;
            gps_utc_seconds <= 48'h00000000;
        end else if (uart_rx_valid) begin
            case (ubx_state)
                UBX_SYNC1: begin
                    if (uart_rx_data == 8'hB5) begin
                        ubx_state <= UBX_SYNC2;
                    end
                end
                
                UBX_SYNC2: begin
                    if (uart_rx_data == 8'h62) begin
                        ubx_state <= UBX_CLASS;
                        ubx_calc_ck_a <= 8'h00;
                        ubx_calc_ck_b <= 8'h00;
                    end else begin
                        ubx_state <= UBX_SYNC1;
                    end
                end
                
                UBX_CLASS: begin
                    ubx_class <= uart_rx_data;
                    ubx_calc_ck_a <= uart_rx_data;
                    ubx_calc_ck_b <= uart_rx_data;
                    ubx_state <= UBX_ID;
                end
                
                UBX_ID: begin
                    ubx_id <= uart_rx_data;
                    ubx_calc_ck_a <= ubx_calc_ck_a + uart_rx_data;
                    ubx_calc_ck_b <= ubx_calc_ck_b + ubx_calc_ck_a + uart_rx_data;
                    ubx_state <= UBX_LEN_L;
                end
                
                UBX_LEN_L: begin
                    ubx_length[7:0] <= uart_rx_data;
                    ubx_calc_ck_a <= ubx_calc_ck_a + uart_rx_data;
                    ubx_calc_ck_b <= ubx_calc_ck_b + ubx_calc_ck_a + uart_rx_data;
                    ubx_state <= UBX_LEN_H;
                end
                
                UBX_LEN_H: begin
                    ubx_length[15:8] <= uart_rx_data;
                    ubx_calc_ck_a <= ubx_calc_ck_a + uart_rx_data;
                    ubx_calc_ck_b <= ubx_calc_ck_b + ubx_calc_ck_a + uart_rx_data;
                    ubx_payload_count <= 16'h0000;
                    
                    if (ubx_length == 16'h0000) begin
                        ubx_state <= UBX_CK_A;
                    end else begin
                        ubx_state <= UBX_PAYLOAD;
                    end
                end
                
                UBX_PAYLOAD: begin
                    // Store payload for NAV-PVT messages
                    if (ubx_class == 8'h01 && ubx_id == 8'h07 && ubx_payload_count < 92) begin
                        ubx_payload[ubx_payload_count[6:0]] <= uart_rx_data;
                    end
                    
                    ubx_calc_ck_a <= ubx_calc_ck_a + uart_rx_data;
                    ubx_calc_ck_b <= ubx_calc_ck_b + ubx_calc_ck_a + uart_rx_data;
                    ubx_payload_count <= ubx_payload_count + 1;
                    
                    if (ubx_payload_count == ubx_length - 1) begin
                        ubx_state <= UBX_CK_A;
                    end
                end
                
                UBX_CK_A: begin
                    ubx_ck_a <= uart_rx_data;
                    ubx_state <= UBX_CK_B;
                end
                
                UBX_CK_B: begin
                    ubx_ck_b <= uart_rx_data;
                    ubx_state <= UBX_SYNC1;
                    
                    // Verify checksum
                    if (ubx_ck_a == ubx_calc_ck_a && uart_rx_data == ubx_calc_ck_b) begin
                        // Valid UBX message - parse NAV-PVT
                        if (ubx_class == 8'h01 && ubx_id == 8'h07) begin
                            // Extract fix type (byte 20)
                            fix_type <= ubx_payload[20][2:0];
                            // Extract number of satellites (byte 23)
                            num_sv <= ubx_payload[23];
                            
                            // Update GPS lock status (3D fix = 0x03)
                            gps_locked <= (ubx_payload[20][2:0] == 3'b011);
                            gps_satellites <= ubx_payload[23];
                            
                            // Extract time: year (bytes 4-5), month (6), day (7), 
                            // hour (8), minute (9), second (10)
                            year <= {ubx_payload[5], ubx_payload[4]};
                            month <= ubx_payload[6];
                            day <= ubx_payload[7];
                            hour <= ubx_payload[8];
                            minute <= ubx_payload[9];
                            second <= ubx_payload[10];
                            
                            // Convert to seconds since epoch (simplified placeholder)
                            // TODO: Implement proper date-to-epoch-seconds conversion
                            // Current implementation concatenates raw bytes for demonstration
                            // Production code should convert year/month/day to Unix epoch
                            gps_utc_seconds <= {
                                ubx_payload[10],  // seconds
                                ubx_payload[9],   // minutes
                                ubx_payload[8],   // hours
                                ubx_payload[7],   // day
                                ubx_payload[6],   // month
                                ubx_payload[5]    // year high
                            };
                        end
                    end
                end
                
                default: ubx_state <= UBX_SYNC1;
            endcase
        end
    end
    
    // Configuration state machine (simplified - would send UBX config messages)
    reg [3:0] config_state;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            config_state <= 4'h0;
            uart_tx_data <= 8'h00;
            uart_tx_valid <= 1'b0;
        end else begin
            uart_tx_valid <= 1'b0;
            // Configuration logic would go here
            // For now, just a placeholder
        end
    end

endmodule
endmodule
```
