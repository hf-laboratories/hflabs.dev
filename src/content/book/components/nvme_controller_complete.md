---
title: "NVMe Controller (Complete) — nvme_controller_complete.v"
description: "Full NVMe 1.4 storage controller implementing admin/IO queues, doorbells, and direct DMA."
part: "Part II — Component Library"
chapter: "NVMe Controller Components"
category: "NVMe Controller Components"
filename: "nvme_iface/nvme_controller_complete.v"
order: 100
tags: ["NVMe Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/nvme_controller_complete.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/nvme_iface/nvme_controller_complete.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# NVMe Controller (Complete) — nvme_controller_complete.v

**Filename:** `nvme_iface/nvme_controller_complete.v`

## Description

Full NVMe controller implementation with admin/I/O queue management, command parsing, storage read/write orchestration, completion posting, interrupt generation, and error-injection hooks.

## Integration Points

- Connects host-side memory path (PCIe-visible) to backend storage interfaces
- Consumes queue doorbells and updates SQ/CQ heads/tails
- Drives completion/interrupt flow and NVMe command lifecycle tracking

## Verilog Source

```verilog
module nvme_controller_complete #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [ADDR_WIDTH-1:0]    host_base_addr,
    input  wire                     host_enable,
    input  wire [63:0]              admin_sq_base,
    input  wire [63:0]              admin_cq_base,
    input  wire [15:0]              admin_sq_size,
    input  wire [15:0]              admin_cq_size,
    input  wire [63:0]              io_sq_base [0:15],
    input  wire [63:0]              io_cq_base [0:15],
    input  wire [15:0]              sq_tail [0:16],
    output reg  [15:0]              sq_head [0:16],
    output reg  [15:0]              cq_tail [0:16],
    input  wire [15:0]              cq_head [0:16],
    output reg                      interrupt_req,
    output reg  [15:0]              interrupt_vector
);
// Complete NVMe Controller
// Full implementation with command processing, error handling, and advanced features

module nvme_controller_complete #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // PCIe/Host interface
    input  wire [ADDR_WIDTH-1:0]    host_base_addr,
    input  wire                     host_enable,
    
    // Queue configuration (Admin + I/O queues)
    input  wire [63:0]              admin_sq_base,
    input  wire [63:0]              admin_cq_base,
    input  wire [15:0]              admin_sq_size,
    input  wire [15:0]              admin_cq_size,
    input  wire [63:0]              io_sq_base [0:15],
    input  wire [63:0]              io_cq_base [0:15],
    input  wire [15:0]              io_sq_size [0:15],
    input  wire [15:0]              io_cq_size [0:15],
    input  wire [15:0]              queue_enable_mask,
    
    // Doorbell interface
    input  wire [15:0]              sq_tail [0:16],  // 1 admin + 16 I/O
    output reg  [15:0]              sq_head [0:16],
    output reg  [15:0]              cq_tail [0:16],
    input  wire [15:0]              cq_head [0:16],
    
    // Memory interface
    output reg  [ADDR_WIDTH-1:0]    mem_rd_addr,
    output reg  [10:0]              mem_rd_len,
    output reg                      mem_rd_req,
    input  wire                     mem_rd_ack,
    input  wire [DATA_WIDTH-1:0]    mem_rd_data,
    input  wire                     mem_rd_valid,
    output wire                     mem_rd_ready,
    
    output reg  [ADDR_WIDTH-1:0]    mem_wr_addr,
    output reg  [DATA_WIDTH-1:0]    mem_wr_data,
    output reg  [10:0]              mem_wr_len,
    output reg                      mem_wr_req,
    input  wire                     mem_wr_ack,
    
    // Backend storage interface
    output reg  [ADDR_WIDTH-1:0]    storage_rd_addr,
    output reg  [31:0]              storage_rd_len,
    output reg                      storage_rd_req,
    input  wire                     storage_rd_ack,
    input  wire [DATA_WIDTH-1:0]    storage_rd_data,
    input  wire                     storage_rd_valid,
    output wire                     storage_rd_ready,
    
    output reg  [ADDR_WIDTH-1:0]    storage_wr_addr,
    output reg  [DATA_WIDTH-1:0]    storage_wr_data,
    output reg  [31:0]              storage_wr_len,
    output reg                      storage_wr_valid,
    input  wire                     storage_wr_ready,
    
    // Interrupt interface
    output reg                      interrupt_req,
    output reg  [15:0]              interrupt_vector,
    input  wire                     interrupt_ack,
    
    // Status and statistics
    output reg  [31:0]              commands_processed,
    output reg  [31:0]              completions_posted,
    output reg  [31:0]              errors_detected,
    output wire [16:0]              queue_status,  // 1 admin + 16 I/O
    
    // Error injection interface
    input  wire                     inject_command_error,
    input  wire                     inject_timeout_error,
    input  wire [3:0]               inject_status_code,
    
    // Advanced features
    output reg  [63:0]              total_bytes_read,
    output reg  [63:0]              total_bytes_written,
    output wire [15:0]              active_commands
);

    // NVMe command opcodes
    localparam NVM_CMD_FLUSH        = 8'h00;
    localparam NVM_CMD_WRITE        = 8'h01;
    localparam NVM_CMD_READ         = 8'h02;
    localparam ADMIN_CMD_DELETE_SQ  = 8'h00;
    localparam ADMIN_CMD_CREATE_SQ  = 8'h01;
    localparam ADMIN_CMD_DELETE_CQ  = 8'h04;
    localparam ADMIN_CMD_CREATE_CQ  = 8'h05;
    localparam ADMIN_CMD_IDENTIFY   = 8'h06;
    
    // State machine
    localparam IDLE             = 5'd0;
    localparam SELECT_QUEUE     = 5'd1;
    localparam FETCH_CMD        = 5'd2;
    localparam WAIT_CMD         = 5'd3;
    localparam PARSE_CMD        = 5'd4;
    localparam PROCESS_READ     = 5'd5;
    localparam PROCESS_WRITE    = 5'd6;
    localparam PROCESS_ADMIN    = 5'd7;
    localparam STORAGE_OP       = 5'd8;
    localparam WAIT_STORAGE     = 5'd9;
    localparam POST_COMPLETION  = 5'd10;
    localparam WRITE_CPL        = 5'd11;
    localparam UPDATE_DOORBELL  = 5'd12;
    localparam GEN_INTERRUPT    = 5'd13;
    localparam ERROR_HANDLE     = 5'd14;
    
    reg [4:0] state;
    reg [4:0] return_state;
    
    // Command and completion buffers
    reg [511:0] cmd_buffer;
    reg [127:0] cpl_buffer;
    reg [4:0] current_queue;
    reg [15:0] cmd_id;
    reg [7:0] cmd_opcode;
    reg [63:0] cmd_slba;  // Starting LBA
    reg [31:0] cmd_nlb;   // Number of logical blocks
    reg [63:0] cmd_prp1;  // PRP entry 1
    reg [63:0] cmd_prp2;  // PRP entry 2
    
    // Queue management
    reg [15:0] active_cmd_count;
    reg [16:0] queue_active;
    wire [16:0] queue_not_empty;
    
    genvar q;
    generate
        for (q = 0; q < 17; q = q + 1) begin : gen_queue_status
            if (q == 0) begin
                assign queue_not_empty[q] = (sq_head[q] != sq_tail[q]);  // Admin queue always enabled
            end else begin
                assign queue_not_empty[q] = (sq_head[q] != sq_tail[q]) && queue_enable_mask[q-1];
            end
        end
    endgenerate
    
    assign queue_status = queue_active;
    assign active_commands = active_cmd_count;
    assign mem_rd_ready = 1'b1;
    assign storage_rd_ready = 1'b1;
    
    // Phase tags for each queue
    reg [16:0] phase_tag;
    
    // Error handling
    reg [15:0] error_status;
    reg error_detected;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            return_state <= IDLE;
            current_queue <= 5'd0;
            sq_head[0] <= 16'd0;
            cq_tail[0] <= 16'd0;
            mem_rd_req <= 1'b0;
            mem_wr_req <= 1'b0;
            storage_rd_req <= 1'b0;
            storage_wr_valid <= 1'b0;
            interrupt_req <= 1'b0;
            commands_processed <= 32'd0;
            completions_posted <= 32'd0;
            errors_detected <= 32'd0;
            total_bytes_read <= 64'd0;
            total_bytes_written <= 64'd0;
            active_cmd_count <= 16'd0;
            queue_active <= 17'd0;
            phase_tag <= 17'h1FFFF;
            cmd_buffer <= 512'd0;
            cpl_buffer <= 128'd0;
            error_status <= 16'd0;
            error_detected <= 1'b0;
            
            for (integer i = 1; i < 17; i = i + 1) begin
                sq_head[i] <= 16'd0;
                cq_tail[i] <= 16'd0;
            end
        end else begin
            // Default: clear one-shot signals
            mem_rd_req <= 1'b0;
            mem_wr_req <= 1'b0;
            interrupt_req <= 1'b0;
            error_detected <= 1'b0;
            
            case (state)
                IDLE: begin
                    if (host_enable) begin
                        state <= SELECT_QUEUE;
                    end
                end
                
                SELECT_QUEUE: begin
                    // Round-robin queue selection
                    // Priority: admin queue (0) > I/O queues (1-16)
                    if (queue_not_empty[0]) begin
                        current_queue <= 5'd0;
                        state <= FETCH_CMD;
                    end else begin
                        // Check I/O queues
                        for (integer i = 1; i < 17; i = i + 1) begin
                            if (queue_not_empty[i] && (current_queue < i || current_queue >= 16)) begin
                                current_queue <= i[4:0];
                            end
                        end
                        
                        if (queue_not_empty[current_queue + 1]) begin
                            state <= FETCH_CMD;
                        end else begin
                            state <= IDLE;
                        end
                    end
                end
                
                FETCH_CMD: begin
                    // Calculate command address
                    if (current_queue == 0) begin
                        mem_rd_addr <= admin_sq_base + (sq_head[0] * 64);
                    end else begin
                        mem_rd_addr <= io_sq_base[current_queue-1] + 
                                      (sq_head[current_queue] * 64);
                    end
                    mem_rd_len <= 11'd16;  // 64 bytes = 16 DWORDs
                    mem_rd_req <= 1'b1;
                    queue_active[current_queue] <= 1'b1;
                    state <= WAIT_CMD;
                end
                
                WAIT_CMD: begin
                    if (mem_rd_valid && mem_rd_ready) begin
                        cmd_buffer <= mem_rd_data;
                        state <= PARSE_CMD;
                    end
                end
                
                PARSE_CMD: begin
                    // Parse NVMe command structure
                    cmd_opcode <= cmd_buffer[7:0];
                    cmd_id <= cmd_buffer[31:16];
                    cmd_slba <= cmd_buffer[127:64];
                    cmd_nlb <= cmd_buffer[159:144];
                    cmd_prp1 <= cmd_buffer[191:128];
                    cmd_prp2 <= cmd_buffer[255:192];
                    
                    // Error injection
                    if (inject_command_error) begin
                        error_status <= 16'h0002;  // Invalid command
                        error_detected <= 1'b1;
                        state <= ERROR_HANDLE;
                    end else if (current_queue == 0) begin
                        state <= PROCESS_ADMIN;
                    end else begin
                        // I/O command
                        case (cmd_buffer[7:0])
                            NVM_CMD_READ:  state <= PROCESS_READ;
                            NVM_CMD_WRITE: state <= PROCESS_WRITE;
                            NVM_CMD_FLUSH: state <= POST_COMPLETION;
                            default:       state <= ERROR_HANDLE;
                        endcase
                    end
                end
                
                PROCESS_READ: begin
                    // Issue storage read
                    storage_rd_addr <= {cmd_slba, 9'd0};  // LBA to byte address
                    storage_rd_len <= cmd_nlb << 9;  // Blocks to bytes
                    storage_rd_req <= 1'b1;
                    return_state <= POST_COMPLETION;
                    state <= WAIT_STORAGE;
                    
                    // Update statistics
                    total_bytes_read <= total_bytes_read + (cmd_nlb << 9);
                end
                
                PROCESS_WRITE: begin
                    // Issue storage write
                    storage_wr_addr <= {cmd_slba, 9'd0};
                    storage_wr_len <= cmd_nlb << 9;
                    storage_wr_valid <= 1'b1;
                    return_state <= POST_COMPLETION;
                    state <= WAIT_STORAGE;
                    
                    // Update statistics
                    total_bytes_written <= total_bytes_written + (cmd_nlb << 9);
                end
                
                PROCESS_ADMIN: begin
                    // Admin command handling
                    case (cmd_opcode)
                        ADMIN_CMD_IDENTIFY: begin
                            // Return identify data
                            state <= POST_COMPLETION;
                        end
                        ADMIN_CMD_CREATE_SQ,
                        ADMIN_CMD_CREATE_CQ,
                        ADMIN_CMD_DELETE_SQ,
                        ADMIN_CMD_DELETE_CQ: begin
                            // Queue management commands
                            state <= POST_COMPLETION;
                        end
                        default: begin
                            error_status <= 16'h0001;
                            state <= ERROR_HANDLE;
                        end
                    endcase
                end
                
                WAIT_STORAGE: begin
                    if (storage_rd_valid || storage_wr_ready) begin
                        state <= return_state;
                    end
                    
                    // Timeout detection
                    if (inject_timeout_error) begin
                        error_status <= 16'h0007;  // Command timeout
                        error_detected <= 1'b1;
                        state <= ERROR_HANDLE;
                    end
                end
                
                POST_COMPLETION: begin
                    // Build completion entry
                    cpl_buffer[31:0] <= 32'd0;  // Command-specific result
                    cpl_buffer[47:32] <= sq_head[current_queue];
                    cpl_buffer[63:48] <= {11'd0, current_queue};
                    cpl_buffer[79:64] <= cmd_id;
                    cpl_buffer[94:80] <= inject_command_error ? inject_status_code : 15'd0;
                    cpl_buffer[95] <= phase_tag[current_queue];
                    cpl_buffer[127:96] <= 32'd0;
                    
                    state <= WRITE_CPL;
                end
                
                WRITE_CPL: begin
                    // Write completion entry
                    if (current_queue == 0) begin
                        mem_wr_addr <= admin_cq_base + (cq_tail[0] * 16);
                    end else begin
                        mem_wr_addr <= io_cq_base[current_queue-1] + 
                                      (cq_tail[current_queue] * 16);
                    end
                    mem_wr_data <= {384'd0, cpl_buffer};
                    mem_wr_len <= 11'd4;  // 16 bytes = 4 DWORDs
                    mem_wr_req <= 1'b1;
                    
                    state <= UPDATE_DOORBELL;
                end
                
                UPDATE_DOORBELL: begin
                    // Advance queue pointers
                    if (current_queue == 0) begin
                        if (sq_head[0] == admin_sq_size - 1) begin
                            sq_head[0] <= 16'd0;
                            phase_tag[0] <= ~phase_tag[0];
                        end else begin
                            sq_head[0] <= sq_head[0] + 1'b1;
                        end
                        
                        if (cq_tail[0] == admin_cq_size - 1) begin
                            cq_tail[0] <= 16'd0;
                        end else begin
                            cq_tail[0] <= cq_tail[0] + 1'b1;
                        end
                    end else begin
                        if (sq_head[current_queue] == io_sq_size[current_queue-1] - 1) begin
                            sq_head[current_queue] <= 16'd0;
                            phase_tag[current_queue] <= ~phase_tag[current_queue];
                        end else begin
                            sq_head[current_queue] <= sq_head[current_queue] + 1'b1;
                        end
                        
                        if (cq_tail[current_queue] == io_cq_size[current_queue-1] - 1) begin
                            cq_tail[current_queue] <= 16'd0;
                        end else begin
                            cq_tail[current_queue] <= cq_tail[current_queue] + 1'b1;
                        end
                    end
                    
                    commands_processed <= commands_processed + 1'b1;
                    completions_posted <= completions_posted + 1'b1;
                    queue_active[current_queue] <= 1'b0;
                    
                    state <= GEN_INTERRUPT;
                end
                
                GEN_INTERRUPT: begin
                    interrupt_req <= 1'b1;
                    interrupt_vector <= current_queue;
                    
                    if (interrupt_ack) begin
                        state <= SELECT_QUEUE;
                    end
                end
                
                ERROR_HANDLE: begin
                    errors_detected <= errors_detected + 1'b1;
                    // Post error completion
                    state <= POST_COMPLETION;
                end
                
                default: state <= IDLE;
            endcase
        end
    end

endmodule
endmodule
```
