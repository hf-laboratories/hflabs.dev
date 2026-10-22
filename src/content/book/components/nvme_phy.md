---
title: "NVMe Physical Layer Interface — nvme_phy.v"
description: "Physical layer protocol bridge between NVMe command parser and high-speed PCIe transceiver lanes."
part: "Part II — Component Library"
chapter: "NVMe Controller Components"
category: "NVMe Controller Components"
filename: "nvme_iface/nvme_phy.v"
order: 100
tags: ["NVMe Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/nvme_phy.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/nvme_iface/nvme_phy.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# NVMe Physical Layer Interface — nvme_phy.v

**Filename:** `nvme_iface/nvme_phy.v`

## Description

Provides an NVMe PHY-facing command/data/completion bridge for read/write data movement and command execution sequencing.

## Integration Points

- Receives NVMe commands from queue/controller path
- Produces completions and data stream responses to host-facing logic
- Represents physical transport boundary toward NVMe SSD link

## Verilog Source

```verilog
module nvme_phy #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [511:0]             cmd_data,
    input  wire [15:0]              cmd_id,
    input  wire                     cmd_valid,
    output reg                      cmd_ready,
    output reg  [127:0]             cpl_data,
    output reg  [15:0]              cpl_cmd_id,
    output reg  [31:0]              cpl_status,
    output reg                      cpl_valid,
    input  wire                     cpl_ready,
    output reg  [DATA_WIDTH-1:0]    rd_data,
    output reg                      rd_valid,
    input  wire                     rd_ready
);
// NVMe Physical Layer Interface
// Integrates with NVMe SSD controller via PCIe or proprietary interface
// Supports standard NVMe protocol with queue management

module nvme_phy #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // NVMe command interface
    input  wire [511:0]             cmd_data,          // NVMe command (64 bytes)
    input  wire [15:0]              cmd_id,
    input  wire                     cmd_valid,
    output reg                      cmd_ready,
    
    // NVMe completion interface
    output reg  [127:0]             cpl_data,          // Completion entry (16 bytes)
    output reg  [15:0]              cpl_cmd_id,
    output reg  [31:0]              cpl_status,
    output reg                      cpl_valid,
    input  wire                     cpl_ready,
    
    // Data read interface (from NVMe to host)
    output reg  [DATA_WIDTH-1:0]    rd_data,
    output reg                      rd_valid,
    output reg                      rd_last,
    input  wire                     rd_ready,
    
    // Data write interface (from host to NVMe)
    input  wire [DATA_WIDTH-1:0]    wr_data,
    input  wire                     wr_valid,
    input  wire                     wr_last,
    output reg                      wr_ready,
    
    // Physical interface to NVMe SSD
    // Note: Actual signals depend on interface type (PCIe, U.2, M.2, etc.)
    output wire [3:0]               nvme_tx_p,
    output wire [3:0]               nvme_tx_n,
    input  wire [3:0]               nvme_rx_p,
    input  wire [3:0]               nvme_rx_n,
    
    // Status and control
    input  wire                     phy_enable,
    output reg                      phy_ready,
    output reg  [31:0]              phy_status,
    output reg  [31:0]              error_count
);

    // NVMe command opcodes
    localparam NVME_CMD_FLUSH        = 8'h00;
    localparam NVME_CMD_WRITE        = 8'h01;
    localparam NVME_CMD_READ         = 8'h02;
    localparam NVME_CMD_WRITE_UNCOR  = 8'h04;
    localparam NVME_CMD_COMPARE      = 8'h05;
    localparam NVME_CMD_WRITE_ZEROS  = 8'h08;
    localparam NVME_CMD_DSM          = 8'h09;
    
    // State machine
    localparam IDLE          = 4'd0;
    localparam PARSE_CMD     = 4'd1;
    localparam ISSUE_CMD     = 4'd2;
    localparam WAIT_DATA     = 4'd3;
    localparam TRANSFER_DATA = 4'd4;
    localparam WAIT_CPL      = 4'd5;
    localparam SEND_CPL      = 4'd6;
    localparam ERROR         = 4'd7;
    
    reg [3:0] state;
    reg [511:0] cmd_buffer;
    reg [7:0] cmd_opcode;
    reg [15:0] cmd_nsid;
    reg [63:0] cmd_slba;      // Starting LBA
    reg [15:0] cmd_nlb;       // Number of logical blocks
    reg [31:0] data_remaining;
    reg [31:0] transfer_count;
    
    // Physical layer interface simulation
    // In production, this would connect to actual NVMe controller
    reg [31:0] sim_delay_counter;
    reg [DATA_WIDTH-1:0] sim_data_buffer;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            cmd_ready <= 1'b0;
            cpl_valid <= 1'b0;
            rd_valid <= 1'b0;
            wr_ready <= 1'b0;
            phy_ready <= 1'b0;
            phy_status <= 32'h0;
            error_count <= 32'h0;
            cmd_buffer <= 512'h0;
            cmd_opcode <= 8'h0;
            data_remaining <= 32'h0;
            sim_delay_counter <= 32'h0;
        end else begin
            case (state)
                IDLE: begin
                    if (phy_enable) begin
                        phy_ready <= 1'b1;
                        cmd_ready <= 1'b1;
                        wr_ready <= 1'b0;
                        
                        if (cmd_valid && cmd_ready) begin
                            cmd_buffer <= cmd_data;
                            cmd_ready <= 1'b0;
                            state <= PARSE_CMD;
                        end
                    end else begin
                        phy_ready <= 1'b0;
                        cmd_ready <= 1'b0;
                    end
                end
                
                PARSE_CMD: begin
                    // Parse NVMe command structure (simplified)
                    // DW0: Opcode, flags, command ID
                    cmd_opcode <= cmd_buffer[7:0];
                    // DW1: Namespace ID
                    cmd_nsid <= cmd_buffer[47:32];
                    // DW10-11: Starting LBA
                    cmd_slba <= cmd_buffer[383:320];
                    // DW12: Number of logical blocks
                    cmd_nlb <= cmd_buffer[415:400];
                    
                    state <= ISSUE_CMD;
                end
                
                ISSUE_CMD: begin
                    // Issue command to NVMe controller
                    // In production, send to actual controller
                    sim_delay_counter <= 32'd100; // Simulate command processing
                    
                    if (cmd_opcode == NVME_CMD_READ) begin
                        // Calculate data to transfer
                        data_remaining <= (cmd_nlb + 1) * 512; // Assume 512B sectors
                        transfer_count <= 32'h0;
                        state <= WAIT_DATA;
                    end else if (cmd_opcode == NVME_CMD_WRITE) begin
                        data_remaining <= (cmd_nlb + 1) * 512;
                        transfer_count <= 32'h0;
                        wr_ready <= 1'b1;
                        state <= TRANSFER_DATA;
                    end else begin
                        // Other commands (flush, etc.)
                        state <= WAIT_CPL;
                    end
                end
                
                WAIT_DATA: begin
                    // Wait for data from NVMe (for reads)
                    if (sim_delay_counter > 0) begin
                        sim_delay_counter <= sim_delay_counter - 1'b1;
                    end else begin
                        state <= TRANSFER_DATA;
                    end
                end
                
                TRANSFER_DATA: begin
                    if (cmd_opcode == NVME_CMD_READ) begin
                        // Transfer data to host
                        rd_valid <= 1'b1;
                        rd_data <= {DATA_WIDTH{1'b1}}; // Simulated data
                        
                        if (rd_valid && rd_ready) begin
                            transfer_count <= transfer_count + (DATA_WIDTH / 8);
                            
                            if (transfer_count + (DATA_WIDTH / 8) >= data_remaining) begin
                                rd_last <= 1'b1;
                                rd_valid <= 1'b0;
                                state <= WAIT_CPL;
                            end else begin
                                rd_last <= 1'b0;
                            end
                        end
                    end else if (cmd_opcode == NVME_CMD_WRITE) begin
                        // Receive data from host
                        if (wr_valid && wr_ready) begin
                            // In production, send to NVMe controller
                            sim_data_buffer <= wr_data;
                            transfer_count <= transfer_count + (DATA_WIDTH / 8);
                            
                            if (wr_last || (transfer_count + (DATA_WIDTH / 8) >= data_remaining)) begin
                                wr_ready <= 1'b0;
                                state <= WAIT_CPL;
                            end
                        end
                    end
                end
                
                WAIT_CPL: begin
                    // Wait for command completion from NVMe
                    if (sim_delay_counter > 0) begin
                        sim_delay_counter <= sim_delay_counter - 1'b1;
                    end else begin
                        state <= SEND_CPL;
                    end
                end
                
                SEND_CPL: begin
                    // Send completion to host
                    cpl_cmd_id <= cmd_id;
                    cpl_status <= 32'h0; // Success
                    cpl_data <= {64'h0, 32'h0, cmd_id, 16'h0}; // Simplified completion
                    cpl_valid <= 1'b1;
                    
                    if (cpl_valid && cpl_ready) begin
                        cpl_valid <= 1'b0;
                        state <= IDLE;
                    end
                end
                
                ERROR: begin
                    error_count <= error_count + 1'b1;
                    phy_status <= 32'hDEAD;  // Error status
                    state <= IDLE;
                end
                
                default: state <= IDLE;
            endcase
        end
    end
    
    // Physical interface (placeholder)
    // In production, connect to actual NVMe PHY (PCIe, SATA, etc.)
    assign nvme_tx_p = 4'hF;
    assign nvme_tx_n = 4'h0;
    
    // Production integration notes:
    // 1. For PCIe NVMe: Use PCIe Hard IP as transport layer
    // 2. For U.2/M.2: Use appropriate PHY IP core
    // 3. Add NVMe controller IP or implement NVMe protocol stack
    // 4. Implement proper error handling and retry logic
    // 5. Add support for multiple namespaces
    // 6. Implement queue management (SQ/CQ)
    // 7. Add performance monitoring and telemetry

endmodule
endmodule
```
