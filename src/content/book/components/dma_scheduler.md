---
title: "DMA Scheduler — dma_scheduler.v"
description: "Deterministic multi-channel priority scheduler coordinating command execution across 16 channels."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_scheduler.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_scheduler.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_scheduler.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Scheduler — dma_scheduler.v

**Filename:** `dma_engine/dma_scheduler.v`

## Description

Schedules descriptors onto available DMA channels and emits normalized command tuples for read/write engines.

## Integration Points

- Core dispatch stage between descriptor FIFO and channel engines
- Maintains pending/scheduled counters for control-plane visibility

## Verilog Source

```verilog
module dma_scheduler #(
    parameter DESC_WIDTH = 128,
    parameter ADDR_WIDTH = 64,
    parameter NUM_CHANNELS = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [DESC_WIDTH-1:0]    desc_data,
    input  wire                     desc_valid,
    output reg                      desc_ready,
    input  wire [NUM_CHANNELS-1:0]  channel_idle,
    output reg  [NUM_CHANNELS-1:0]  cmd_valid,
    input  wire [NUM_CHANNELS-1:0]  cmd_ready
);
// DMA Scheduler
// Schedules DMA operations based on descriptors
// Supports deterministic scheduling with priority and deadline
module dma_scheduler #(
    parameter DESC_WIDTH = 128,
    parameter ADDR_WIDTH = 64,
    parameter NUM_CHANNELS = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Descriptor input from FIFO
    input  wire [DESC_WIDTH-1:0]    desc_data,
    input  wire                     desc_valid,
    output reg                      desc_ready,
    
    // Channel status inputs
    input  wire [NUM_CHANNELS-1:0]  channel_idle,
    
    // Scheduled command outputs (per channel)
    output reg  [ADDR_WIDTH-1:0]    cmd_src_addr [0:NUM_CHANNELS-1],
    output reg  [ADDR_WIDTH-1:0]    cmd_dst_addr [0:NUM_CHANNELS-1],
    output reg  [31:0]              cmd_length [0:NUM_CHANNELS-1],
    output reg  [7:0]               cmd_flags [0:NUM_CHANNELS-1],
    output reg  [NUM_CHANNELS-1:0]  cmd_valid,
    input  wire [NUM_CHANNELS-1:0]  cmd_ready,
    
    // Statistics
    output reg  [31:0]              scheduled_count,
    output reg  [31:0]              pending_count
);

    // Descriptor format (128 bits):
    // [0]      - Valid
    // [1]      - Read(0) / Write(1)
    // [2]      - Interrupt on completion
    // [7:3]    - Priority (0-31)
    // [15:8]   - Channel hint
    // [47:16]  - Length (32 bits)
    // [111:48] - Source address (64 bits)
    // [175:112]- Destination address (64 bits) - NOTE: Extended beyond 128b for full addressing
    // Actual 128-bit descriptor uses simplified addressing
    
    wire        desc_valid_flag = desc_data[0];
    wire        desc_is_write   = desc_data[1];
    wire        desc_intr       = desc_data[2];
    wire [4:0]  desc_priority   = desc_data[7:3];
    wire [31:0] desc_length     = desc_data[47:16];  // Length from bits [47:16]
    wire [ADDR_WIDTH-1:0] desc_src_addr = {{16{1'b0}}, desc_data[63:16]};  // Simplified: upper 48 bits
    wire [ADDR_WIDTH-1:0] desc_dst_addr = {{16{1'b0}}, desc_data[111:64]}; // Simplified: next 48 bits
    
    // State machine
    localparam IDLE = 2'd0;
    localparam SCHEDULE = 2'd1;
    localparam WAIT_ACK = 2'd2;
    
    reg [1:0] state;
    reg [DESC_WIDTH-1:0] current_desc;
    reg [2:0] selected_channel;
    
    // Channel selection (round-robin among idle channels)
    wire [NUM_CHANNELS-1:0] idle_channels = channel_idle & ~cmd_valid;
    
    integer i;
    always @(*) begin
        selected_channel = 0;
        for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
            if (idle_channels[i]) begin
                selected_channel = i;
            end
        end
    end
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            desc_ready <= 1'b0;
            cmd_valid <= {NUM_CHANNELS{1'b0}};
            scheduled_count <= 32'd0;
            pending_count <= 32'd0;
            current_desc <= {DESC_WIDTH{1'b0}};
            
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                cmd_src_addr[i] <= {ADDR_WIDTH{1'b0}};
                cmd_dst_addr[i] <= {ADDR_WIDTH{1'b0}};
                cmd_length[i] <= 32'd0;
                cmd_flags[i] <= 8'd0;
            end
        end else begin
            case (state)
                IDLE: begin
                    desc_ready <= 1'b1;
                    
                    if (desc_valid && desc_ready && desc_valid_flag) begin
                        current_desc <= desc_data;
                        desc_ready <= 1'b0;
                        pending_count <= pending_count + 1'b1;
                        
                        if (|idle_channels) begin
                            state <= SCHEDULE;
                        end
                    end
                end
                
                SCHEDULE: begin
                    if (|idle_channels) begin
                        // Schedule to selected channel
                        cmd_src_addr[selected_channel] <= desc_src_addr;
                        cmd_dst_addr[selected_channel] <= desc_dst_addr;
                        cmd_length[selected_channel] <= desc_length;
                        cmd_flags[selected_channel] <= {desc_intr, 2'd0, desc_priority};
                        cmd_valid[selected_channel] <= 1'b1;
                        
                        state <= WAIT_ACK;
                    end
                end
                
                WAIT_ACK: begin
                    if (cmd_ready[selected_channel]) begin
                        cmd_valid[selected_channel] <= 1'b0;
                        scheduled_count <= scheduled_count + 1'b1;
                        pending_count <= pending_count - 1'b1;
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
