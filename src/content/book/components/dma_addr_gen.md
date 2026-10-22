---
title: "DMA Address Generator — dma_addr_gen.v"
description: "Calculates sequential beat addresses, 4KB page crossing boundaries, and burst lengths."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_addr_gen.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_addr_gen.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_addr_gen.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Address Generator — dma_addr_gen.v

**Filename:** `dma_engine/dma_addr_gen.v`

## Description

Generates sequential beat addresses for DMA transfers from base address, transfer length, and burst size.

## Integration Points

- Used by read/write DMA engines to walk transfer windows
- Provides beat countdown/status to transfer FSMs

## Verilog Source

```verilog
module dma_addr_gen #(
    parameter ADDR_WIDTH = 64,
    parameter LEN_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [ADDR_WIDTH-1:0]    base_addr,
    input  wire [LEN_WIDTH-1:0]     transfer_len,
    input  wire [3:0]               burst_size,
    input  wire                     start,
    output reg                      done,
    output reg  [ADDR_WIDTH-1:0]    addr,
    output reg                      addr_valid
);
// DMA Address Generator
// Generates sequential addresses for DMA transfers
module dma_addr_gen #(
    parameter ADDR_WIDTH = 64,
    parameter LEN_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Control interface
    input  wire [ADDR_WIDTH-1:0]    base_addr,
    input  wire [LEN_WIDTH-1:0]     transfer_len,      // In bytes
    input  wire [3:0]               burst_size,        // Log2(bytes per beat)
    input  wire                     start,
    output reg                      done,
    
    // Address output interface
    output reg  [ADDR_WIDTH-1:0]    addr,
    output reg                      addr_valid,
    input  wire                     addr_ready,
    
    // Beat counter output
    output reg  [LEN_WIDTH-1:0]     beats_remaining
);

    localparam IDLE = 2'd0;
    localparam GEN_ADDR = 2'd1;
    localparam DONE = 2'd2;
    
    reg [1:0] state;
    reg [LEN_WIDTH-1:0] bytes_transferred;
    wire [LEN_WIDTH-1:0] bytes_per_beat = 1 << burst_size;
    wire [LEN_WIDTH-1:0] total_beats = (transfer_len + bytes_per_beat - 1) >> burst_size;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            addr <= {ADDR_WIDTH{1'b0}};
            addr_valid <= 1'b0;
            done <= 1'b0;
            bytes_transferred <= {LEN_WIDTH{1'b0}};
            beats_remaining <= {LEN_WIDTH{1'b0}};
        end else begin
            case (state)
                IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        addr <= base_addr;
                        bytes_transferred <= {LEN_WIDTH{1'b0}};
                        beats_remaining <= total_beats;
                        state <= GEN_ADDR;
                    end
                end
                
                GEN_ADDR: begin
                    if (beats_remaining > 0) begin
                        addr_valid <= 1'b1;
                        
                        if (addr_valid && addr_ready) begin
                            // Address accepted, generate next
                            addr <= addr + bytes_per_beat;
                            bytes_transferred <= bytes_transferred + bytes_per_beat;
                            beats_remaining <= beats_remaining - 1'b1;
                            
                            if (beats_remaining == 1) begin
                                addr_valid <= 1'b0;
                                state <= DONE;
                            end
                        end
                    end else begin
                        state <= DONE;
                    end
                end
                
                DONE: begin
                    addr_valid <= 1'b0;
                    done <= 1'b1;
                    state <= IDLE;
                end
                
                default: state <= IDLE;
            endcase
        end
    end

endmodule
endmodule
```
