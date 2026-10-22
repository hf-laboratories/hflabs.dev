---
title: "NVMe Queue Handler — nvme_queue.v"
description: "Handles Submission Queue command fetches and Completion Queue posting with doorbell synchronization."
part: "Part II — Component Library"
chapter: "NVMe Controller Components"
category: "NVMe Controller Components"
filename: "nvme_iface/nvme_queue.v"
order: 100
tags: ["NVMe Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/nvme_queue.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/nvme_iface/nvme_queue.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# NVMe Queue Handler — nvme_queue.v

**Filename:** `nvme_iface/nvme_queue.v`

## Description

Manages NVMe submission/completion queues, including command fetch, command forwarding, completion entry construction, and CQ tail/phase updates.

## Integration Points

- Queue front-end between host doorbells and NVMe command processing engine
- Memory read/write path for SQ command fetch and CQ completion posting
- Provides command stream to execution core and receives completion results

## Verilog Source

```verilog
module nvme_queue #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64,
    parameter CMD_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [63:0]              sq_base_addr,
    input  wire [63:0]              cq_base_addr,
    input  wire [15:0]              sq_size,
    input  wire [15:0]              cq_size,
    input  wire                     queue_enable,
    input  wire [15:0]              sq_tail,
    output reg  [15:0]              sq_head,
    output reg  [15:0]              cq_tail,
    output reg  [511:0]             cmd_data,
    output reg  [15:0]              cmd_id,
    output reg                      cmd_valid,
    input  wire                     cmd_ready
);
// NVMe Queue Handler
// Manages NVMe submission and completion queues
module nvme_queue #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64,
    parameter CMD_WIDTH = 64       // NVMe command size in bytes
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Queue configuration
    input  wire [63:0]              sq_base_addr,
    input  wire [63:0]              cq_base_addr,
    input  wire [15:0]              sq_size,
    input  wire [15:0]              cq_size,
    input  wire                     queue_enable,
    
    // Doorbell interface (from host)
    input  wire [15:0]              sq_tail,         // Host writes SQ tail
    output reg  [15:0]              sq_head,         // Device updates SQ head
    output reg  [15:0]              cq_tail,         // Device writes CQ tail  
    output reg  [15:0]              cq_head,         // Host updates CQ head
    
    // Memory read interface (for fetching commands)
    output reg  [ADDR_WIDTH-1:0]    mem_rd_addr,
    output reg  [10:0]              mem_rd_len,
    output reg                      mem_rd_req,
    input  wire                     mem_rd_ack,
    input  wire [DATA_WIDTH-1:0]    mem_rd_data,
    input  wire                     mem_rd_valid,
    output wire                     mem_rd_ready,
    
    // Memory write interface (for posting completions)
    output reg  [ADDR_WIDTH-1:0]    mem_wr_addr,
    output reg  [DATA_WIDTH-1:0]    mem_wr_data,
    output reg  [10:0]              mem_wr_len,
    output reg                      mem_wr_req,
    input  wire                     mem_wr_ack,
    
    // Command output to processing engine
    output reg  [511:0]             cmd_data,        // NVMe command (64 bytes)
    output reg  [15:0]              cmd_id,
    output reg                      cmd_valid,
    input  wire                     cmd_ready,
    
    // Completion input from processing engine
    input  wire [15:0]              cpl_cmd_id,
    input  wire [31:0]              cpl_status,
    input  wire [31:0]              cpl_result,
    input  wire                     cpl_valid,
    output reg                      cpl_ready,
    
    // Status
    output reg  [31:0]              processed_cmds,
    output reg  [31:0]              posted_completions
);

    localparam IDLE         = 4'd0;
    localparam FETCH_CMD    = 4'd1;
    localparam WAIT_CMD     = 4'd2;
    localparam PARSE_CMD    = 4'd3;
    localparam FORWARD_CMD  = 4'd4;
    localparam POST_CPL     = 4'd5;
    localparam WRITE_CPL    = 4'd6;
    localparam UPDATE_TAIL  = 4'd7;
    
    reg [3:0] state;
    reg [511:0] cmd_buffer;
    reg [127:0] cpl_buffer;
    
    // Calculate queue addresses
    wire [ADDR_WIDTH-1:0] sq_cmd_addr = sq_base_addr + (sq_head * CMD_WIDTH);
    wire [ADDR_WIDTH-1:0] cq_entry_addr = cq_base_addr + (cq_tail * 16);  // 16 bytes per completion
    
    // Check if there are commands to process
    wire sq_not_empty = (sq_head != sq_tail);
    
    // NVMe completion entry format (16 bytes):
    // [31:0]   - Command-specific result
    // [47:32]  - Submission queue head pointer
    // [63:48]  - Submission queue identifier
    // [79:64]  - Command identifier
    // [94:80]  - Status field
    // [95]     - Phase tag
    // [127:96] - Reserved
    
    reg phase_tag;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            sq_head <= 16'd0;
            cq_tail <= 16'd0;
            mem_rd_req <= 1'b0;
            mem_wr_req <= 1'b0;
            cmd_valid <= 1'b0;
            cpl_ready <= 1'b0;
            processed_cmds <= 32'd0;
            posted_completions <= 32'd0;
            phase_tag <= 1'b1;
            cmd_buffer <= 512'd0;
            cpl_buffer <= 128'd0;
        end else begin
            case (state)
                IDLE: begin
                    cpl_ready <= 1'b1;
                    
                    if (queue_enable) begin
                        if (cpl_valid && cpl_ready) begin
                            // Priority: handle completions first
                            state <= POST_CPL;
                        end else if (sq_not_empty) begin
                            // Fetch next command
                            state <= FETCH_CMD;
                        end
                    end
                end
                
                FETCH_CMD: begin
                    mem_rd_addr <= sq_cmd_addr;
                    mem_rd_len <= (CMD_WIDTH / 4);  // Convert bytes to DWORDs
                    mem_rd_req <= 1'b1;
                    state <= WAIT_CMD;
                end
                
                WAIT_CMD: begin
                    if (mem_rd_ack) begin
                        mem_rd_req <= 1'b0;
                    end
                    
                    if (mem_rd_valid && mem_rd_ready) begin
                        cmd_buffer <= mem_rd_data[511:0];
                        state <= PARSE_CMD;
                    end
                end
                
                PARSE_CMD: begin
                    cmd_data <= cmd_buffer;
                    cmd_id <= cmd_buffer[31:16];  // Command ID is in DW0[31:16]
                    state <= FORWARD_CMD;
                end
                
                FORWARD_CMD: begin
                    cmd_valid <= 1'b1;
                    
                    if (cmd_valid && cmd_ready) begin
                        cmd_valid <= 1'b0;
                        
                        // Advance SQ head
                        if (sq_head == sq_size - 1)
                            sq_head <= 16'd0;
                        else
                            sq_head <= sq_head + 1'b1;
                        
                        processed_cmds <= processed_cmds + 1'b1;
                        state <= IDLE;
                    end
                end
                
                POST_CPL: begin
                    cpl_ready <= 1'b0;
                    
                    // Build completion entry
                    cpl_buffer[31:0]   <= cpl_result;
                    cpl_buffer[47:32]  <= sq_head;
                    cpl_buffer[63:48]  <= 16'd0;           // SQ ID
                    cpl_buffer[79:64]  <= cpl_cmd_id;
                    cpl_buffer[94:80]  <= cpl_status[14:0];
                    cpl_buffer[95]     <= phase_tag;
                    cpl_buffer[127:96] <= 32'd0;
                    
                    state <= WRITE_CPL;
                end
                
                WRITE_CPL: begin
                    mem_wr_addr <= cq_entry_addr;
                    mem_wr_data <= {384'd0, cpl_buffer};
                    mem_wr_len <= 11'd4;  // 16 bytes = 4 DWORDs
                    mem_wr_req <= 1'b1;
                    
                    if (mem_wr_ack) begin
                        mem_wr_req <= 1'b0;
                        state <= UPDATE_TAIL;
                    end
                end
                
                UPDATE_TAIL: begin
                    // Advance CQ tail
                    if (cq_tail == cq_size - 1) begin
                        cq_tail <= 16'd0;
                        phase_tag <= ~phase_tag;  // Toggle phase on wrap
                    end else begin
                        cq_tail <= cq_tail + 1'b1;
                    end
                    
                    posted_completions <= posted_completions + 1'b1;
                    state <= IDLE;
                end
                
                default: state <= IDLE;
            endcase
        end
    end
    
    assign mem_rd_ready = (state == WAIT_CMD);

endmodule
endmodule
```
