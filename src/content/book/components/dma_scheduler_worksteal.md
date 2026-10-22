---
title: "DMA Scheduler (Work-Stealing) — dma_scheduler_worksteal.v"
description: "High-throughput enhanced scheduler featuring per-channel lock-free ring buffers and hardware work-stealing."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_scheduler_worksteal.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_scheduler_worksteal.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_scheduler_worksteal.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Scheduler (Work-Stealing) — dma_scheduler_worksteal.v

**Filename:** `dma_engine/dma_scheduler_worksteal.v`

## Description

Enhanced scheduler with per-channel work queues and hardware work stealing to rebalance load across idle/busy channels.

## Integration Points

- Drop-in advanced scheduler for high-contention scenarios
- Uses BAR-configurable stealing thresholds/policies
- Tracks steal attempts and stolen work statistics

## Verilog Source

```verilog
module dma_scheduler_worksteal #(
    parameter DESC_WIDTH = 128,
    parameter ADDR_WIDTH = 64,
    parameter NUM_CHANNELS = 16,
    parameter QUEUE_DEPTH = 16,
    parameter STEAL_THRESHOLD = 4
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [DESC_WIDTH-1:0]        desc_data,
    input  wire                         desc_valid,
    output reg                          desc_ready,
    input  wire [NUM_CHANNELS-1:0]      channel_idle,
    input  wire                         steal_enable,
    output reg  [31:0]                  stolen_count
);
// DMA Scheduler with Hardware Work Stealing
// Enhanced scheduler that allows idle channels to steal work from busy channel queues
// Supports threshold-based and priority-aware stealing policies
//
// Work stealing algorithm:
// 1. Each channel has a local work queue
// 2. When a channel goes idle and its queue is empty, it checks other channels
// 3. If another channel's queue exceeds the steal threshold, work is stolen
// 4. Stolen work is re-assigned to the idle channel
//
module dma_scheduler_worksteal #(
    parameter DESC_WIDTH = 128,
    parameter ADDR_WIDTH = 64,
    parameter NUM_CHANNELS = 16,
    parameter QUEUE_DEPTH = 16,           // Per-channel queue depth
    parameter STEAL_THRESHOLD = 4         // Min queue depth to allow stealing
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // Descriptor input from fetch unit
    input  wire [DESC_WIDTH-1:0]        desc_data,
    input  wire                         desc_valid,
    output reg                          desc_ready,
    
    // Channel status inputs
    input  wire [NUM_CHANNELS-1:0]      channel_idle,
    input  wire [NUM_CHANNELS-1:0]      channel_busy,
    
    // Scheduled command outputs (per channel)
    output reg  [ADDR_WIDTH-1:0]        cmd_src_addr [0:NUM_CHANNELS-1],
    output reg  [ADDR_WIDTH-1:0]        cmd_dst_addr [0:NUM_CHANNELS-1],
    output reg  [31:0]                  cmd_length [0:NUM_CHANNELS-1],
    output reg  [7:0]                   cmd_flags [0:NUM_CHANNELS-1],
    output reg  [NUM_CHANNELS-1:0]      cmd_valid,
    input  wire [NUM_CHANNELS-1:0]      cmd_ready,
    
    // Work stealing configuration (from BAR)
    input  wire                         steal_enable,
    input  wire [3:0]                   steal_threshold,      // Min items for victim
    input  wire                         priority_aware_steal, // Consider priority when stealing
    
    // Statistics
    output reg  [31:0]                  scheduled_count,
    output reg  [31:0]                  pending_count,
    output reg  [31:0]                  stolen_count,         // Work items stolen
    output reg  [31:0]                  steal_attempts,       // Steal attempts made
    output reg  [NUM_CHANNELS-1:0]      queue_not_empty       // Per-channel queue status
);

    // Descriptor format (128 bits):
    // [0]      - Valid
    // [1]      - Read(0) / Write(1)
    // [2]      - Interrupt on completion
    // [7:3]    - Priority (0-31)
    // [15:8]   - Channel hint
    // [47:16]  - Length (32 bits)
    // [111:48] - Source address (64 bits)
    
    // Per-channel work queues
    reg [DESC_WIDTH-1:0] work_queue [0:NUM_CHANNELS-1][0:QUEUE_DEPTH-1];
    reg [4:0] queue_head [0:NUM_CHANNELS-1];  // Write pointer
    reg [4:0] queue_tail [0:NUM_CHANNELS-1];  // Read pointer
    reg [4:0] queue_count [0:NUM_CHANNELS-1]; // Item count
    
    // Descriptor parsing
    wire        desc_valid_flag = desc_data[0];
    wire        desc_is_write   = desc_data[1];
    wire        desc_intr       = desc_data[2];
    wire [4:0]  desc_priority   = desc_data[7:3];
    wire [7:0]  desc_channel_hint = desc_data[15:8];
    wire [31:0] desc_length     = desc_data[47:16];
    wire [ADDR_WIDTH-1:0] desc_src_addr = {{16{1'b0}}, desc_data[63:16]};
    wire [ADDR_WIDTH-1:0] desc_dst_addr = {{16{1'b0}}, desc_data[111:64]};
    
    // State machine
    localparam IDLE         = 3'd0;
    localparam ENQUEUE      = 3'd1;
    localparam DISPATCH     = 3'd2;
    localparam WAIT_ACK     = 3'd3;
    localparam CHECK_STEAL  = 3'd4;
    localparam STEAL        = 3'd5;
    
    reg [2:0] state;
    reg [DESC_WIDTH-1:0] current_desc;
    reg [3:0] target_channel;
    reg [3:0] steal_victim;
    reg [3:0] steal_target;
    
    // Round-robin channel selection
    reg [3:0] last_assigned;
    
    // Work stealing state
    reg [3:0] steal_scan_idx;
    reg steal_found;
    
    integer i, j;
    
    // Find best channel for new descriptor (considers hint and load)
    function [3:0] find_best_channel;
        input [7:0] hint;
        input [4:0] priority_in;
        reg [3:0] best_ch;
        reg [4:0] min_load;
        reg found;
        begin
            best_ch = hint[3:0];  // Start with hinted channel
            min_load = queue_count[hint[3:0]];
            found = 0;
            
            // If hinted channel is full, find least loaded
            if (queue_count[hint[3:0]] >= QUEUE_DEPTH - 1) begin
                min_load = 5'd31;
                for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                    if (queue_count[i] < min_load) begin
                        min_load = queue_count[i];
                        best_ch = i;
                    end
                end
            end
            
            find_best_channel = best_ch;
        end
    endfunction
    
    // Find channel with most queued work (steal victim)
    function [3:0] find_steal_victim;
        input [3:0] thief;  // Channel that wants to steal
        reg [3:0] victim;
        reg [4:0] max_load;
        reg found;
        begin
            victim = 0;
            max_load = 0;
            found = 0;
            
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                // Don't steal from self, and require above threshold
                if (i != thief && queue_count[i] > max_load && queue_count[i] >= steal_threshold) begin
                    // Priority-aware: don't steal high priority work for low priority channel
                    // (simplified: always allow stealing for now)
                    max_load = queue_count[i];
                    victim = i;
                    found = 1;
                end
            end
            
            find_steal_victim = found ? victim : thief;  // Return self if no victim found
        end
    endfunction
    
    // Find idle channel that needs work
    function [3:0] find_idle_thief;
        reg [3:0] thief;
        reg found;
        begin
            thief = 0;
            found = 0;
            
            for (i = 0; i < NUM_CHANNELS && !found; i = i + 1) begin
                if (channel_idle[i] && queue_count[i] == 0 && !cmd_valid[i]) begin
                    thief = i;
                    found = 1;
                end
            end
            
            find_idle_thief = found ? thief : 4'd15;  // Return invalid if none found
        end
    endfunction
    
    // Generate queue not empty flags
    always @(*) begin
        for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
            queue_not_empty[i] = (queue_count[i] > 0);
        end
    end
    
    // Main scheduler logic
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            desc_ready <= 1'b1;
            cmd_valid <= {NUM_CHANNELS{1'b0}};
            scheduled_count <= 32'd0;
            pending_count <= 32'd0;
            stolen_count <= 32'd0;
            steal_attempts <= 32'd0;
            current_desc <= {DESC_WIDTH{1'b0}};
            target_channel <= 4'd0;
            steal_victim <= 4'd0;
            steal_target <= 4'd0;
            last_assigned <= 4'd0;
            steal_scan_idx <= 4'd0;
            steal_found <= 1'b0;
            
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                queue_head[i] <= 5'd0;
                queue_tail[i] <= 5'd0;
                queue_count[i] <= 5'd0;
                cmd_src_addr[i] <= {ADDR_WIDTH{1'b0}};
                cmd_dst_addr[i] <= {ADDR_WIDTH{1'b0}};
                cmd_length[i] <= 32'd0;
                cmd_flags[i] <= 8'd0;
            end
            
        end else begin
            // Handle command acknowledgments
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                if (cmd_valid[i] && cmd_ready[i]) begin
                    cmd_valid[i] <= 1'b0;
                    scheduled_count <= scheduled_count + 1;
                end
            end
            
            case (state)
                IDLE: begin
                    desc_ready <= 1'b1;
                    
                    // Priority 1: Accept new descriptor
                    if (desc_valid && desc_ready && desc_valid_flag) begin
                        current_desc <= desc_data;
                        desc_ready <= 1'b0;
                        target_channel <= find_best_channel(desc_channel_hint, desc_priority);
                        state <= ENQUEUE;
                        
                    // Priority 2: Dispatch from local queues to idle channels
                    end else begin
                        for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                            if (channel_idle[i] && !cmd_valid[i] && queue_count[i] > 0) begin
                                // Dispatch from this channel's queue
                                target_channel <= i;
                                state <= DISPATCH;
                            end
                        end
                        
                        // Priority 3: Work stealing check
                        if (state == IDLE && steal_enable) begin
                            steal_target <= find_idle_thief();
                            if (find_idle_thief() < NUM_CHANNELS) begin
                                state <= CHECK_STEAL;
                                steal_attempts <= steal_attempts + 1;
                            end
                        end
                    end
                end
                
                ENQUEUE: begin
                    // Add descriptor to target channel's queue
                    if (queue_count[target_channel] < QUEUE_DEPTH) begin
                        work_queue[target_channel][queue_head[target_channel]] <= current_desc;
                        queue_head[target_channel] <= (queue_head[target_channel] + 1) % QUEUE_DEPTH;
                        queue_count[target_channel] <= queue_count[target_channel] + 1;
                        pending_count <= pending_count + 1;
                        last_assigned <= target_channel;
                    end
                    // If queue full, try next channel (not implemented - would need retry logic)
                    state <= IDLE;
                end
                
                DISPATCH: begin
                    // Pop descriptor from queue and dispatch
                    if (queue_count[target_channel] > 0 && !cmd_valid[target_channel]) begin
                        current_desc <= work_queue[target_channel][queue_tail[target_channel]];
                        queue_tail[target_channel] <= (queue_tail[target_channel] + 1) % QUEUE_DEPTH;
                        queue_count[target_channel] <= queue_count[target_channel] - 1;
                        pending_count <= pending_count - 1;
                        
                        // Parse and dispatch using corrected bit ranges
                        // Descriptor format (128 bits):
                        // [47:16]  - Length (32 bits)
                        // [63:48]  - Reserved / Source addr low (16 bits)  
                        // [95:64]  - Source address bits [31:0]
                        // [127:96] - Destination address bits [31:0]
                        // Note: Full 64-bit addressing requires extended descriptor format
                        cmd_src_addr[target_channel] <= {{32{1'b0}}, work_queue[target_channel][queue_tail[target_channel]][95:64]};
                        cmd_dst_addr[target_channel] <= {{32{1'b0}}, work_queue[target_channel][queue_tail[target_channel]][127:96]};
                        cmd_length[target_channel] <= work_queue[target_channel][queue_tail[target_channel]][47:16];
                        cmd_flags[target_channel] <= {work_queue[target_channel][queue_tail[target_channel]][2], 
                                                     2'd0, 
                                                     work_queue[target_channel][queue_tail[target_channel]][7:3]};
                        cmd_valid[target_channel] <= 1'b1;
                    end
                    state <= IDLE;
                end
                
                CHECK_STEAL: begin
                    // Find a victim channel with enough queued work
                    steal_victim <= find_steal_victim(steal_target);
                    if (find_steal_victim(steal_target) != steal_target && 
                        queue_count[find_steal_victim(steal_target)] >= steal_threshold) begin
                        steal_found <= 1'b1;
                        state <= STEAL;
                    end else begin
                        steal_found <= 1'b0;
                        state <= IDLE;
                    end
                end
                
                STEAL: begin
                    // Move one descriptor from victim to thief
                    if (queue_count[steal_victim] > 0 && queue_count[steal_target] < QUEUE_DEPTH) begin
                        // Pop from victim (take from head - newest work)
                        queue_head[steal_victim] <= (queue_head[steal_victim] == 0) ? 
                                                    (QUEUE_DEPTH - 1) : (queue_head[steal_victim] - 1);
                        queue_count[steal_victim] <= queue_count[steal_victim] - 1;
                        
                        // Push to thief's queue
                        work_queue[steal_target][queue_head[steal_target]] <= 
                            work_queue[steal_victim][(queue_head[steal_victim] == 0) ? 
                                                     (QUEUE_DEPTH - 1) : (queue_head[steal_victim] - 1)];
                        queue_head[steal_target] <= (queue_head[steal_target] + 1) % QUEUE_DEPTH;
                        queue_count[steal_target] <= queue_count[steal_target] + 1;
                        
                        stolen_count <= stolen_count + 1;
                    end
                    state <= IDLE;
                end
                
                default: state <= IDLE;
            endcase
        end
    end

endmodule
endmodule
```
