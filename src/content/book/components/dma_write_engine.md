---
title: "DMA Write Engine — dma_write_engine.v"
description: "Issues PCIe Memory Read TLPs to host memory and streams payloads into storage/accelerator memory."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_write_engine.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_write_engine.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_write_engine.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Write Engine — dma_write_engine.v

**Filename:** `dma_engine/dma_write_engine.v`

## Description

Executes DMA write workflows by reading payloads from host memory over PCIe and writing to NVMe/storage.

## Integration Points

- Command consumer for scheduler-issued write ops
- PCIe read requester + NVMe write producer
- Emits completion and telemetry signals

## Verilog Source

```verilog
module dma_write_engine #(
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
    output reg  [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output reg                      pcie_rd_req,
    output reg  [ADDR_WIDTH-1:0]    nvme_wr_addr,
    output reg                      nvme_wr_valid
);
// DMA Write Engine
// Reads data from host memory via PCIe and writes to NVMe/storage
module dma_write_engine #(
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
    
    // PCIe read interface (to fetch write data)
    output reg  [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output reg  [15:0]              pcie_rd_len,
    output reg                      pcie_rd_req,
    input  wire                     pcie_rd_ack,
    
    // PCIe read data interface
    input  wire [DATA_WIDTH-1:0]    pcie_rd_data,
    input  wire                     pcie_rd_valid,
    output wire                     pcie_rd_ready,
    
    // NVMe write interface
    output reg  [ADDR_WIDTH-1:0]    nvme_wr_addr,
    output reg  [DATA_WIDTH-1:0]    nvme_wr_data,
    output reg  [15:0]              nvme_wr_len,
    output reg                      nvme_wr_valid,
    input  wire                     nvme_wr_ready,
    
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
    localparam REQ_PCIE    = 4'd2;
    localparam WAIT_PCIE   = 4'd3;
    localparam RCV_DATA    = 4'd4;
    localparam WR_NVME     = 4'd5;
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
            pcie_rd_req <= 1'b0;
            nvme_wr_valid <= 1'b0;
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
                    state <= REQ_PCIE;
                end
                
                REQ_PCIE: begin
                    pcie_rd_addr <= src_addr;
                    pcie_rd_len <= burst_beats;
                    pcie_rd_req <= 1'b1;
                    state <= WAIT_PCIE;
                end
                
                WAIT_PCIE: begin
                    if (pcie_rd_ack) begin
                        pcie_rd_req <= 1'b0;
                        state <= RCV_DATA;
                    end
                end
                
                RCV_DATA: begin
                    if (pcie_rd_valid && pcie_rd_ready) begin
                        data_buffer <= pcie_rd_data;
                        state <= WR_NVME;
                    end
                end
                
                WR_NVME: begin
                    nvme_wr_addr <= dst_addr;
                    nvme_wr_data <= data_buffer;
                    nvme_wr_len <= burst_beats;
                    nvme_wr_valid <= 1'b1;
                    state <= WAIT_WR;
                end
                
                WAIT_WR: begin
                    if (nvme_wr_ready) begin
                        nvme_wr_valid <= 1'b0;
                        
                        // Update addresses and counters
                        src_addr <= src_addr + burst_bytes;
                        dst_addr <= dst_addr + burst_bytes;
                        bytes_remaining <= bytes_remaining - burst_bytes;
                        total_bytes_transferred <= total_bytes_transferred + burst_bytes;
                        
                        if (bytes_remaining <= burst_bytes) begin
                            state <= COMPLETE;
                        end else begin
                            state <= REQ_PCIE;
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
    
    assign pcie_rd_ready = (state == RCV_DATA);

endmodule
endmodule
```
