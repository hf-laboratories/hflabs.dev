---
title: "UART Transmitter — uart_tx.sv"
description: "Buffered UART transmission module with ready/valid streaming interface."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/uart_tx.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/uart_tx.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/uart_tx.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# UART Transmitter — uart_tx.sv

**Filename:** `timing/uart_tx.sv`

## Description

Configurable UART TX module with ready/valid handshake and optional parity/stop-bit configuration for timing subsystem command/config egress.

## Integration Points

- Used by GPS interface path for outbound UART configuration and command traffic
- Companion to `uart_rx` in LEA-M8T communication loop
- Reusable serial output primitive for timing/management plane features

## Verilog Source

```verilog
module uart_tx #(
    parameter CLK_FREQ_HZ = 100_000_000,
    parameter BAUD_RATE = 115200,
    parameter PARITY_EN = 0,
    parameter STOP_BITS = 1
)(
    input  wire clk,
    input  wire rst_n,
    input  wire [7:0] tx_data,
    input  wire tx_valid,
    output reg  tx_ready,
    output reg  uart_tx
);
// UART Transmitter Module
// SystemVerilog UART TX with ready/valid handshake
// Supports configurable baud rate, 8N1 format

module uart_tx #(
    parameter CLK_FREQ_HZ = 100_000_000,  // System clock frequency
    parameter BAUD_RATE = 115200,          // UART baud rate
    parameter PARITY_EN = 0,               // 0=none, 1=even, 2=odd
    parameter STOP_BITS = 1                // Number of stop bits (1 or 2)
)(
    input  wire        clk,
    input  wire        rst_n,
    
    // Transmit data interface
    input  wire [7:0]  tx_data,
    input  wire        tx_valid,
    output reg         tx_ready,
    
    // UART physical interface
    output reg         uart_tx
);

    // Calculate cycles per bit
    localparam CYCLES_PER_BIT = CLK_FREQ_HZ / BAUD_RATE;
    
    // State machine
    typedef enum logic [2:0] {
        IDLE,
        START,
        DATA,
        PARITY,
        STOP
    } state_t;
    
    state_t state, next_state;
    
    // Timing counter for bit transmission
    reg [$clog2(CYCLES_PER_BIT)-1:0] bit_timer;
    reg [2:0] bit_index;
    reg [7:0] tx_shift;
    reg parity_bit;
    reg [1:0] stop_count;
    
    // State machine
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            bit_timer <= 0;
            bit_index <= 0;
            tx_shift <= 8'h00;
            uart_tx <= 1'b1;  // UART idle state is high
            tx_ready <= 1'b1;
            parity_bit <= 1'b0;
            stop_count <= 0;
        end else begin
            case (state)
                IDLE: begin
                    uart_tx <= 1'b1;  // Idle high
                    tx_ready <= 1'b1;
                    bit_timer <= 0;
                    bit_index <= 0;
                    stop_count <= 0;
                    
                    if (tx_valid && tx_ready) begin
                        tx_shift <= tx_data;
                        tx_ready <= 1'b0;
                        state <= START;
                        
                        // Pre-calculate parity
                        if (PARITY_EN == 1) begin
                            parity_bit <= ^tx_data;  // Even parity
                        end else if (PARITY_EN == 2) begin
                            parity_bit <= ~^tx_data;  // Odd parity
                        end
                    end
                end
                
                START: begin
                    uart_tx <= 1'b0;  // Start bit is low
                    
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        bit_timer <= 0;
                        state <= DATA;
                    end else begin
                        bit_timer <= bit_timer + 1;
                    end
                end
                
                DATA: begin
                    uart_tx <= tx_shift[bit_index];
                    
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        bit_timer <= 0;
                        
                        if (bit_index == 7) begin
                            // All 8 bits transmitted
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
                    uart_tx <= parity_bit;
                    
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        bit_timer <= 0;
                        state <= STOP;
                    end else begin
                        bit_timer <= bit_timer + 1;
                    end
                end
                
                STOP: begin
                    uart_tx <= 1'b1;  // Stop bit is high
                    
                    if (bit_timer == CYCLES_PER_BIT - 1) begin
                        bit_timer <= 0;
                        stop_count <= stop_count + 1;
                        
                        if (stop_count == STOP_BITS - 1) begin
                            state <= IDLE;
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
