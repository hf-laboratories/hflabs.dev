---
title: "DMA Completion Handler — dma_completion.v"
description: "Processes transfer completion tokens, writes ring completion queue entries, and triggers MSI-X interrupts."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_completion.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_completion.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_completion.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Completion Handler — dma_completion.v

**Filename:** `dma_engine/dma_completion.v`

## Description

Aggregates per-channel completion events, writes completion queue entries, and raises host interrupts.

## Integration Points

- Consumes completion notifications from DMA engines
- Writes CQ records into host-visible memory space
- Drives interrupt signaling for completion processing

## Verilog Source

```verilog
module dma_completion #(
    parameter ADDR_WIDTH = 64,
    parameter NUM_CHANNELS = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [NUM_CHANNELS-1:0]  completion_valid,
    input  wire [31:0]              completion_tag [0:NUM_CHANNELS-1],
    output reg  [NUM_CHANNELS-1:0]  completion_ready,
    output reg  [ADDR_WIDTH-1:0]    cq_wr_addr,
    output reg  [127:0]             cq_wr_data,
    output reg                      interrupt_req
);
// DMA Completion Handler
// Manages DMA completion notifications and interrupts
module dma_completion #(
    parameter ADDR_WIDTH = 64,
    parameter NUM_CHANNELS = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Completion inputs from read/write engines
    input  wire [NUM_CHANNELS-1:0]  completion_valid,
    input  wire [31:0]              completion_tag [0:NUM_CHANNELS-1],
    output reg  [NUM_CHANNELS-1:0]  completion_ready,
    
    // Completion queue write (to host memory)
    output reg  [ADDR_WIDTH-1:0]    cq_wr_addr,
    output reg  [127:0]             cq_wr_data,
    output reg                      cq_wr_req,
    input  wire                     cq_wr_ack,
    
    // Interrupt interface
    output reg                      interrupt_req,
    input  wire                     interrupt_ack,
    
    // Configuration
    input  wire [ADDR_WIDTH-1:0]    cq_base_addr,
    input  wire [15:0]              cq_size,
    
    // Status
    output reg  [15:0]              cq_head,
    output reg  [31:0]              completed_count
);

    localparam IDLE         = 3'd0;
    localparam SELECT_CH    = 3'd1;
    localparam WRITE_CQ     = 3'd2;
    localparam WAIT_ACK     = 3'd3;
    localparam GEN_INT      = 3'd4;
    
    reg [2:0] state;
    reg [2:0] selected_channel;
    reg [31:0] current_tag;
    reg [63:0] completion_timestamp;
    
    // Channel selection (priority encoder)
    integer i;
    always @(*) begin
        selected_channel = 0;
        for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
            if (completion_valid[i]) begin
                selected_channel = i;
            end
        end
    end
    
    // Completion queue entry format (128 bits):
    // [31:0]   - Completion tag
    // [63:32]  - Status / error code
    // [127:64] - Timestamp
    
    wire [ADDR_WIDTH-1:0] cq_entry_addr = cq_base_addr + (cq_head * 16);  // 16 bytes per entry
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            completion_ready <= {NUM_CHANNELS{1'b0}};
            cq_wr_req <= 1'b0;
            interrupt_req <= 1'b0;
            cq_head <= 16'd0;
            completed_count <= 32'd0;
            completion_timestamp <= 64'd0;
            current_tag <= 32'd0;
        end else begin
            // Increment timestamp counter
            completion_timestamp <= completion_timestamp + 1'b1;
            
            case (state)
                IDLE: begin
                    if (|completion_valid) begin
                        state <= SELECT_CH;
                    end
                end
                
                SELECT_CH: begin
                    if (completion_valid[selected_channel]) begin
                        current_tag <= completion_tag[selected_channel];
                        state <= WRITE_CQ;
                    end else begin
                        state <= IDLE;
                    end
                end
                
                WRITE_CQ: begin
                    cq_wr_addr <= cq_entry_addr;
                    cq_wr_data <= {completion_timestamp, 32'd0, current_tag};
                    cq_wr_req <= 1'b1;
                    state <= WAIT_ACK;
                end
                
                WAIT_ACK: begin
                    if (cq_wr_ack) begin
                        cq_wr_req <= 1'b0;
                        completion_ready[selected_channel] <= 1'b1;
                        
                        // Update head pointer
                        if (cq_head == cq_size - 1)
                            cq_head <= 16'd0;
                        else
                            cq_head <= cq_head + 1'b1;
                        
                        completed_count <= completed_count + 1'b1;
                        state <= GEN_INT;
                    end
                end
                
                GEN_INT: begin
                    completion_ready[selected_channel] <= 1'b0;
                    interrupt_req <= 1'b1;
                    
                    if (interrupt_ack) begin
                        interrupt_req <= 1'b0;
                        state <= IDLE;
                    end
                end
                
                default: state <= IDLE;
            endcase
        end
    end

endmodule
endmodule
```
