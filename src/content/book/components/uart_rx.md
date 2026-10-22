---
title: "UART Receiver — uart_rx.sv"
description: "Metastability-safe UART receiver core with 16x oversampling and configurable baud rate generator."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/uart_rx.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/uart_rx.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/uart_rx.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# UART Receiver — uart_rx.sv

**Filename:** `timing/uart_rx.sv`

## Description

Configurable UART RX module with metastability protection, frame/parity error detection, and ready/valid output semantics for robust serial ingress.

## Integration Points

- Used by GPS interface path for receiving UBX payload bytes
- Provides error signaling consumed by upper-layer parser/monitoring logic
- Serves as reusable timing-subsystem serial input primitive

## Verilog Source

```verilog
module uart_rx #(
    parameter CLK_FREQ_HZ = 100_000_000,
    parameter BAUD_RATE = 115200,
    parameter PARITY_EN = 0,
    parameter STOP_BITS = 1
)(
    input  wire clk,
    input  wire rst_n,
    input  wire uart_rx,
    output reg  [7:0] rx_data,
    output reg  rx_valid,
    input  wire rx_ready,
    output reg  frame_error,
    output reg  parity_error
);
// UART Receiver Module
// SystemVerilog UART RX with metastability protection and error detection
// Supports configurable baud rate, 8N1 format

module uart_rx #(
    parameter CLK_FREQ_HZ = 100_000_000,  // System clock frequency
    parameter BAUD_RATE = 115200,          // UART baud rate
    parameter PARITY_EN = 0,               // 0=none, 1=even, 2=odd
    parameter STOP_BITS = 1                // Number of stop bits (1 or 2)
)(
    input  wire        clk,
    input  wire        rst_n,
    
    // UART physical interface
    input  wire        uart_rx,
    
    // Received data interface
    output reg  [7:0]  rx_data,
    output reg         rx_valid,
    input  wire        rx_ready,
    
    // Error flags
    output reg         frame_error,
    output reg         parity_error
);

    // Calculate cycles per bit
    localparam CYCLES_PER_BIT = CLK_FREQ_HZ / BAUD_RATE;
    localparam HALF_BIT = CYCLES_PER_BIT / 2;
    
    // State machine
    typedef enum logic [2:0] {
        IDLE,
        START,
        DATA,
        PARITY,
        STOP
    } state_t;
    
    state_t state, next_state;
    
    // 3-stage metastability synchronizer
    reg [2:0] uart_rx_sync;
    wire uart_rx_stable = uart_rx_sync[2];
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            uart_rx_sync <= 3'b111;
        end else begin
            uart_rx_sync <= {uart_rx_sync[1:0], uart_rx};
        end
    end
    
    // Timing counter for bit sampling
    reg [$clog2(CYCLES_PER_BIT)-1:0] bit_timer;
    reg [2:0] bit_index;
    reg [7:0] rx_shift;
    reg parity_bit;
    reg [1:0] stop_count;
    
    // State machine
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            bit_timer <= 0;
            bit_index <= 0;
            rx_shift <= 8'h00;
            rx_data <= 8'h00;
            rx_valid <= 1'b0;
            frame_error <= 1'b0;
            parity_error <= 1'b0;
            parity_bit <= 1'b0;
            stop_count <= 0;
        end else begin
            // Default: clear single-cycle signals
            rx_valid <= 1'b0;
            frame_error <= 1'b0;
            parity_error <= 1'b0;
            
            case (state)
                IDLE: begin
                    bit_timer <= 0;
                    bit_index <= 0;
                    stop_count <= 0;
                    // Wait for start bit (falling edge)
                    if (!uart_rx_stable) begin
                        state <= START;
                        bit_timer <= HALF_BIT;  // Sample in middle of start bit
                    end
                end
                
                START: begin
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        // Sample start bit in the middle
                        if (!uart_rx_stable) begin
                            // Valid start bit, move to data
                            state <= DATA;
                            bit_timer <= 0;
                            bit_index <= 0;
                        end else begin
                            // False start, go back to idle
                            state <= IDLE;
                        end
                    end else begin
                        bit_timer <= bit_timer + 1;
                    end
                end
                
                DATA: begin
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        // Sample data bit
                        rx_shift[bit_index] <= uart_rx_stable;
                        bit_timer <= 0;
                        
                        if (bit_index == 7) begin
                            // All 8 bits received
                            if (PARITY_EN != 0) begin
                                state <= PARITY;
                            end else begin
                                state <= STOP;
                            end
                        end else begin
                            bit_index <= bit_index + 1;
                        end
                    end else begin
                        bit_timer <= bit_timer + 1;
                    end
                end
                
                PARITY: begin
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        parity_bit <= uart_rx_stable;
                        bit_timer <= 0;
                        state <= STOP;
                        
                        // Check parity
                        if (PARITY_EN == 1) begin
                            // Even parity
                            if ((^rx_shift) != uart_rx_stable) begin
                                parity_error <= 1'b1;
                            end
                        end else if (PARITY_EN == 2) begin
                            // Odd parity
                            if ((~^rx_shift) != uart_rx_stable) begin
                                parity_error <= 1'b1;
                            end
                        end
                    end else begin
                        bit_timer <= bit_timer + 1;
                    end
                end
                
                STOP: begin
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        bit_timer <= 0;
                        
                        if (!uart_rx_stable) begin
                            // Invalid stop bit
                            frame_error <= 1'b1;
                            state <= IDLE;
                        end else begin
                            stop_count <= stop_count + 1;
                            
                            if (stop_count == STOP_BITS - 1) begin
                                // Valid frame received
                                rx_data <= rx_shift;
                                rx_valid <= 1'b1;
                                state <= IDLE;
                            end
                        end
                    end else begin
                        bit_timer <= bit_timer + 1;
                    end
                end
                
                default: state <= IDLE;
            endcase
        end
    end

endmodule
endmodule
```
