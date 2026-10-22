---
title: "DMA Read Engine — dma_read_engine.v"
description: "Orchestrates memory reads from storage and constructs PCIe Memory Write TLPs to host memory."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_read_engine.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_read_engine.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_read_engine.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Read Engine — dma_read_engine.v

**Filename:** `dma_engine/dma_read_engine.v`

## Description

Executes DMA read workflows by reading from NVMe/storage and writing payloads to host memory over PCIe.

## Integration Points

- Command consumer for scheduler-issued read ops
- NVMe read requester + PCIe write producer
- Emits completion and telemetry signals

## Verilog Source

```verilog
module dma_read_engine #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [ADDR_WIDTH-1:0]    cmd_src_addr,
    input  wire [ADDR_WIDTH-1:0]    cmd_dst_addr,
    input  wire [31:0]              cmd_length,
    input  wire                     cmd_valid,
    output reg                      cmd_ready,
    output reg  [ADDR_WIDTH-1:0]    nvme_rd_addr,
    output reg                      nvme_rd_req,
    output reg  [ADDR_WIDTH-1:0]    pcie_wr_addr,
    output reg                      pcie_wr_valid
);
// DMA Read Engine
// Reads data from NVMe/storage and writes to host memory via PCIe
module dma_read_engine #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Command interface from scheduler
    input  wire [ADDR_WIDTH-1:0]    cmd_src_addr,
    input  wire [ADDR_WIDTH-1:0]    cmd_dst_addr,
    input  wire [31:0]              cmd_length,
    input  wire [7:0]               cmd_flags,
    input  wire                     cmd_valid,
    output reg                      cmd_ready,
    
    // NVMe read interface
    output reg  [ADDR_WIDTH-1:0]    nvme_rd_addr,
    output reg  [15:0]              nvme_rd_len,
    output reg                      nvme_rd_req,
    input  wire                     nvme_rd_ack,
    
    // NVMe read data interface
    input  wire [DATA_WIDTH-1:0]    nvme_rd_data,
    input  wire                     nvme_rd_valid,
    output wire                     nvme_rd_ready,
    
    // PCIe write interface (for read data)
    output reg  [ADDR_WIDTH-1:0]    pcie_wr_addr,
    output reg  [DATA_WIDTH-1:0]    pcie_wr_data,
    output reg  [15:0]              pcie_wr_len,
    output reg                      pcie_wr_valid,
    input  wire                     pcie_wr_ready,
    
    // Completion notification
    output reg                      completion_valid,
    output reg  [31:0]              completion_tag,
    input  wire                     completion_ready,
    
    // Status
    output reg                      busy,
    
    // Telemetry outputs
    output wire                     telemetry_transfer_start,
    output wire                     telemetry_transfer_complete,
    output wire                     telemetry_transfer_error,
    output wire [31:0]              telemetry_bytes_transferred,
    output wire [31:0]              telemetry_cycles
);

    localparam IDLE        = 4'd0;
    localparam PARSE_CMD   = 4'd1;
    localparam REQ_NVME    = 4'd2;
    localparam WAIT_NVME   = 4'd3;
    localparam RCV_DATA    = 4'd4;
    localparam WR_PCIE     = 4'd5;
    localparam WAIT_WR     = 4'd6;
    localparam COMPLETE    = 4'd7;
    
    reg [3:0] state;
    reg [ADDR_WIDTH-1:0] src_addr;
    reg [ADDR_WIDTH-1:0] dst_addr;
    reg [31:0] bytes_remaining;
    reg [31:0] current_tag;
    reg [DATA_WIDTH-1:0] data_buffer;
    
    // Telemetry tracking
    reg [31:0] total_bytes_transferred;
    reg [31:0] cycle_counter;
    reg transfer_started;
    reg transfer_completed;
    reg transfer_error;
    
    // Burst size calculation (max 4KB)
    wire [15:0] burst_bytes = (bytes_remaining > 4096) ? 4096 : bytes_remaining[15:0];
    wire [15:0] burst_beats = (burst_bytes + (DATA_WIDTH/8) - 1) / (DATA_WIDTH/8);
    
    // Telemetry outputs
    assign telemetry_transfer_start = transfer_started;
    assign telemetry_transfer_complete = transfer_completed;
    assign telemetry_transfer_error = transfer_error;
    assign telemetry_bytes_transferred = total_bytes_transferred;
    assign telemetry_cycles = cycle_counter;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            cmd_ready <= 1'b1;
            busy <= 1'b0;
            nvme_rd_req <= 1'b0;
            pcie_wr_valid <= 1'b0;
            completion_valid <= 1'b0;
            src_addr <= {ADDR_WIDTH{1'b0}};
            dst_addr <= {ADDR_WIDTH{1'b0}};
            bytes_remaining <= 32'd0;
            current_tag <= 32'd0;
            data_buffer <= {DATA_WIDTH{1'b0}};
            // Telemetry reset
            total_bytes_transferred <= 32'd0;
            cycle_counter <= 32'd0;
            transfer_started <= 1'b0;
            transfer_completed <= 1'b0;
            transfer_error <= 1'b0;
        end else begin
            // Clear one-cycle telemetry signals
            transfer_started <= 1'b0;
            transfer_completed <= 1'b0;
            transfer_error <= 1'b0;
            
            // Increment cycle counter when busy
            if (busy)
                cycle_counter <= cycle_counter + 1'b1;
            
            case (state)
                IDLE: begin
                    cmd_ready <= 1'b1;
                    busy <= 1'b0;
                    cycle_counter <= 32'd0;
                    total_bytes_transferred <= 32'd0;
                    
                    if (cmd_valid && cmd_ready) begin
                        state <= PARSE_CMD;
                        cmd_ready <= 1'b0;
                    end
                end
                
                PARSE_CMD: begin
                    src_addr <= cmd_src_addr;
                    dst_addr <= cmd_dst_addr;
                    bytes_remaining <= cmd_length;
                    current_tag <= current_tag + 1'b1;
                    busy <= 1'b1;
                    transfer_started <= 1'b1;  // Signal transfer start
                    state <= REQ_NVME;
                end
                
                REQ_NVME: begin
                    nvme_rd_addr <= src_addr;
                    nvme_rd_len <= burst_beats;
                    nvme_rd_req <= 1'b1;
                    state <= WAIT_NVME;
                end
                
                WAIT_NVME: begin
                    if (nvme_rd_ack) begin
                        nvme_rd_req <= 1'b0;
                        state <= RCV_DATA;
                    end
                end
                
                RCV_DATA: begin
                    if (nvme_rd_valid && nvme_rd_ready) begin
                        data_buffer <= nvme_rd_data;
                        state <= WR_PCIE;
                    end
                end
                
                WR_PCIE: begin
                    pcie_wr_addr <= dst_addr;
                    pcie_wr_data <= data_buffer;
                    pcie_wr_len <= burst_beats;
                    pcie_wr_valid <= 1'b1;
                    state <= WAIT_WR;
                end
                
                WAIT_WR: begin
                    if (pcie_wr_ready) begin
                        pcie_wr_valid <= 1'b0;
                        
                        // Update addresses and counters
                        src_addr <= src_addr + burst_bytes;
                        dst_addr <= dst_addr + burst_bytes;
                        bytes_remaining <= bytes_remaining - burst_bytes;
                        total_bytes_transferred <= total_bytes_transferred + burst_bytes;
                        
                        if (bytes_remaining <= burst_bytes) begin
                            state <= COMPLETE;
                        end else begin
                            state <= REQ_NVME;
                        end
                    end
                end
                
                COMPLETE: begin
                    completion_valid <= 1'b1;
                    completion_tag <= current_tag;
                    transfer_completed <= 1'b1;  // Signal transfer completion
                    
                    if (completion_ready) begin
                        completion_valid <= 1'b0;
                        state <= IDLE;
                    end
                end
                
                default: state <= IDLE;
            endcase
        end
    end
    
    assign nvme_rd_ready = (state == RCV_DATA);

endmodule
endmodule
```
