---
title: "QoS Bandwidth Controller — qos_bandwidth_controller.v"
description: "Enforces weighted fair queuing (WFQ) and token-bucket rate limiting per DMA channel."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/qos_bandwidth_controller.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/qos_bandwidth_controller.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/qos_bandwidth_controller.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# QoS Bandwidth Controller — qos_bandwidth_controller.v

**Filename:** `dma_engine/qos_bandwidth_controller.v`

## Description

Adaptive bandwidth allocator using token buckets and weighted fair queuing across DMA channels, with optional ML feedback inputs.

## Integration Points

- Governs channel grant/bytes for DMA arbitration
- BAR-configured limits, burst sizes, and channel weights
- Exposes throttle and throughput statistics

## Verilog Source

```verilog
module qos_bandwidth_controller #(
    parameter NUM_CHANNELS = 16,
    parameter TOKEN_DEPTH = 32,
    parameter BANDWIDTH_UNIT = 1024
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [NUM_CHANNELS-1:0]      channel_request,
    input  wire [31:0]                  request_bytes [0:NUM_CHANNELS-1],
    output reg  [NUM_CHANNELS-1:0]      channel_grant,
    output reg  [31:0]                  grant_bytes [0:NUM_CHANNELS-1],
    input  wire [9:0]                   config_addr,
    input  wire [31:0]                  config_wdata,
    input  wire                         config_wr
);
// Adaptive QoS / Bandwidth Allocation Module
// Implements dynamic bandwidth partitioning across DMA channels
// Uses token bucket algorithm with weighted fair queuing
//
// Features:
// - Per-channel bandwidth limits
// - Priority-to-bandwidth mapping
// - Burst allowance configuration
// - ML feedback integration for adaptive adjustment
//
module qos_bandwidth_controller #(
    parameter NUM_CHANNELS = 16,
    parameter TOKEN_DEPTH = 32,           // Bits for token bucket depth
    parameter BANDWIDTH_UNIT = 1024       // Bandwidth granularity (1KB)
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // Channel request interface
    input  wire [NUM_CHANNELS-1:0]      channel_request,      // Channel wants to transmit
    input  wire [31:0]                  request_bytes [0:NUM_CHANNELS-1],  // Bytes requested
    input  wire [2:0]                   channel_priority [0:NUM_CHANNELS-1],  // 0-7 priority
    
    // Grant interface
    output reg  [NUM_CHANNELS-1:0]      channel_grant,
    output reg  [31:0]                  grant_bytes [0:NUM_CHANNELS-1],
    
    // Completion feedback (for token replenishment)
    input  wire [NUM_CHANNELS-1:0]      transfer_complete,
    input  wire [31:0]                  bytes_transferred [0:NUM_CHANNELS-1],
    
    // BAR configuration interface
    input  wire [9:0]                   config_addr,          // Register address
    input  wire [31:0]                  config_wdata,         // Write data
    input  wire                         config_wr,            // Write enable
    output reg  [31:0]                  config_rdata,         // Read data
    input  wire                         config_rd,            // Read enable
    
    // ML feedback input (from telemetry ranking)
    input  wire                         ml_feedback_valid,
    input  wire [NUM_CHANNELS-1:0]      ml_priority_adjust,   // Priority adjustment hints
    input  wire [31:0]                  ml_bandwidth_hints [0:NUM_CHANNELS-1],
    
    // Statistics outputs
    output reg  [63:0]                  total_bytes_granted,
    output reg  [63:0]                  total_bytes_completed,
    output reg  [31:0]                  throttle_events,
    output reg  [NUM_CHANNELS-1:0]      channel_throttled
);

    // Per-channel configuration registers (base address per channel: ch * 16)
    // Offset 0x00: Bandwidth limit (bytes per 1ms interval)
    // Offset 0x04: Burst allowance (max tokens)
    // Offset 0x08: Weight (for weighted fair queuing, 0-255)
    // Offset 0x0C: Reserved
    
    reg [31:0] bandwidth_limit [0:NUM_CHANNELS-1];   // Bytes per interval
    reg [31:0] burst_allowance [0:NUM_CHANNELS-1];   // Max token accumulation
    reg [7:0]  channel_weight [0:NUM_CHANNELS-1];    // WFQ weight
    reg [TOKEN_DEPTH-1:0] token_bucket [0:NUM_CHANNELS-1];  // Current tokens
    
    // Global configuration
    reg [31:0] refill_interval;      // Clock cycles between token refills (default: 1ms)
    reg [31:0] cycle_counter;
    reg        refill_pending;
    
    // Priority-to-bandwidth mapping (8 priority levels)
    reg [31:0] priority_bandwidth [0:7];  // Additional bandwidth per priority level
    
    // Arbitration state
    reg [NUM_CHANNELS-1:0] pending_requests;
    reg [3:0] current_channel;
    reg [3:0] last_served;
    
    // Weighted round-robin state
    reg [7:0] weight_counter [0:NUM_CHANNELS-1];
    
    integer i, j;
    
    // Default configuration
    localparam DEFAULT_BANDWIDTH = 32'd100_000_000;  // 100 MB/s per channel
    localparam DEFAULT_BURST = 32'd1_000_000;        // 1 MB burst
    localparam DEFAULT_WEIGHT = 8'd16;               // Equal weight
    localparam DEFAULT_REFILL = 32'd250_000;         // 1ms at 250 MHz
    
    // Find highest priority requesting channel with tokens
    function [3:0] find_next_channel;
        input [NUM_CHANNELS-1:0] requests;
        input [3:0] start_from;
        reg [3:0] ch;
        reg found;
        begin
            find_next_channel = start_from;
            found = 0;
            
            // First pass: check from start_from to end
            for (i = 0; i < NUM_CHANNELS && !found; i = i + 1) begin
                ch = (start_from + i) % NUM_CHANNELS;
                if (requests[ch] && token_bucket[ch] >= request_bytes[ch] && weight_counter[ch] > 0) begin
                    find_next_channel = ch;
                    found = 1;
                end
            end
            
            // If no channel with full tokens, allow partial grant
            if (!found) begin
                for (i = 0; i < NUM_CHANNELS && !found; i = i + 1) begin
                    ch = (start_from + i) % NUM_CHANNELS;
                    if (requests[ch] && token_bucket[ch] > 0 && weight_counter[ch] > 0) begin
                        find_next_channel = ch;
                        found = 1;
                    end
                end
            end
        end
    endfunction
    
    // Configuration register access
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            config_rdata <= 32'd0;
            refill_interval <= DEFAULT_REFILL;
            
            // Initialize per-channel configs
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                bandwidth_limit[i] <= DEFAULT_BANDWIDTH;
                burst_allowance[i] <= DEFAULT_BURST;
                channel_weight[i] <= DEFAULT_WEIGHT;
            end
            
            // Initialize priority bandwidth mapping
            for (i = 0; i < 8; i = i + 1) begin
                priority_bandwidth[i] <= i * 32'd10_000_000;  // 10 MB/s per priority level
            end
            
        end else begin
            // Register write
            if (config_wr) begin
                if (config_addr < 10'h100) begin
                    // Per-channel registers
                    case (config_addr[3:0])
                        4'h0: bandwidth_limit[config_addr[7:4]] <= config_wdata;
                        4'h4: burst_allowance[config_addr[7:4]] <= config_wdata;
                        4'h8: channel_weight[config_addr[7:4]] <= config_wdata[7:0];
                        default: ;
                    endcase
                end else if (config_addr >= 10'h100 && config_addr < 10'h120) begin
                    // Priority mapping registers
                    priority_bandwidth[config_addr[2:0]] <= config_wdata;
                end else if (config_addr == 10'h200) begin
                    refill_interval <= config_wdata;
                end
            end
            
            // Register read
            if (config_rd) begin
                if (config_addr < 10'h100) begin
                    case (config_addr[3:0])
                        4'h0: config_rdata <= bandwidth_limit[config_addr[7:4]];
                        4'h4: config_rdata <= burst_allowance[config_addr[7:4]];
                        4'h8: config_rdata <= {24'd0, channel_weight[config_addr[7:4]]};
                        4'hC: config_rdata <= token_bucket[config_addr[7:4]];  // Current tokens
                        default: config_rdata <= 32'd0;
                    endcase
                end else if (config_addr >= 10'h100 && config_addr < 10'h120) begin
                    config_rdata <= priority_bandwidth[config_addr[2:0]];
                end else if (config_addr == 10'h200) begin
                    config_rdata <= refill_interval;
                end else begin
                    config_rdata <= 32'd0;
                end
            end
        end
    end
    
    // Token refill and grant logic
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            cycle_counter <= 32'd0;
            refill_pending <= 1'b0;
            channel_grant <= {NUM_CHANNELS{1'b0}};
            channel_throttled <= {NUM_CHANNELS{1'b0}};
            pending_requests <= {NUM_CHANNELS{1'b0}};
            current_channel <= 4'd0;
            last_served <= 4'd0;
            
            total_bytes_granted <= 64'd0;
            total_bytes_completed <= 64'd0;
            throttle_events <= 32'd0;
            
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                token_bucket[i] <= DEFAULT_BURST;
                weight_counter[i] <= DEFAULT_WEIGHT;
                grant_bytes[i] <= 32'd0;
            end
            
        end else begin
            // Clear grants from previous cycle
            channel_grant <= {NUM_CHANNELS{1'b0}};
            
            // Token refill timer
            cycle_counter <= cycle_counter + 1;
            if (cycle_counter >= refill_interval) begin
                cycle_counter <= 32'd0;
                refill_pending <= 1'b1;
            end
            
            // Token refill (add tokens up to burst limit)
            if (refill_pending) begin
                refill_pending <= 1'b0;
                for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                    // Calculate tokens to add (bandwidth_limit / refill_interval in cycles)
                    // At 1ms interval and 100 MB/s, add 100KB tokens
                    if (token_bucket[i] + (bandwidth_limit[i] / 1000) <= burst_allowance[i]) begin
                        token_bucket[i] <= token_bucket[i] + (bandwidth_limit[i] / 1000);
                    end else begin
                        token_bucket[i] <= burst_allowance[i];
                    end
                    
                    // Reset weight counters for WFQ
                    weight_counter[i] <= channel_weight[i];
                end
            end
            
            // ML feedback integration
            if (ml_feedback_valid) begin
                for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                    if (ml_priority_adjust[i]) begin
                        // Adjust bandwidth based on ML hint (clamped to reasonable range)
                        if (ml_bandwidth_hints[i] > 0 && ml_bandwidth_hints[i] < 32'd1_000_000_000) begin
                            bandwidth_limit[i] <= ml_bandwidth_hints[i];
                        end
                    end
                end
            end
            
            // Transfer completion - update statistics
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                if (transfer_complete[i]) begin
                    total_bytes_completed <= total_bytes_completed + bytes_transferred[i];
                end
            end
            
            // Arbitration: Grant requests based on tokens and weight
            pending_requests <= channel_request;
            
            if (|pending_requests) begin
                current_channel <= find_next_channel(pending_requests, last_served + 1);
                
                if (pending_requests[current_channel]) begin
                    // Check if channel has sufficient tokens
                    if (token_bucket[current_channel] >= request_bytes[current_channel]) begin
                        // Full grant
                        channel_grant[current_channel] <= 1'b1;
                        grant_bytes[current_channel] <= request_bytes[current_channel];
                        token_bucket[current_channel] <= token_bucket[current_channel] - request_bytes[current_channel];
                        total_bytes_granted <= total_bytes_granted + request_bytes[current_channel];
                        channel_throttled[current_channel] <= 1'b0;
                        
                        // Decrement weight counter
                        if (weight_counter[current_channel] > 0) begin
                            weight_counter[current_channel] <= weight_counter[current_channel] - 1;
                        end
                        
                    end else if (token_bucket[current_channel] > 0) begin
                        // Partial grant (all available tokens)
                        channel_grant[current_channel] <= 1'b1;
                        grant_bytes[current_channel] <= token_bucket[current_channel];
                        total_bytes_granted <= total_bytes_granted + token_bucket[current_channel];
                        token_bucket[current_channel] <= {TOKEN_DEPTH{1'b0}};
                        channel_throttled[current_channel] <= 1'b1;
                        throttle_events <= throttle_events + 1;
                        
                    end else begin
                        // No tokens, throttle
                        channel_throttled[current_channel] <= 1'b1;
                        throttle_events <= throttle_events + 1;
                    end
                    
                    last_served <= current_channel;
                end
            end
        end
    end

endmodule
endmodule
```
