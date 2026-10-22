---
title: "DMA Descriptor Fetch — dma_desc_fetch.v"
description: "Fetches ring-buffer descriptors over PCIe from host memory and segregates descriptor queues."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_desc_fetch.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_desc_fetch.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_desc_fetch.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Descriptor Fetch — dma_desc_fetch.v

**Filename:** `dma_engine/dma_desc_fetch.v`

## Description

Fetches descriptors over PCIe, parses descriptor type/flags, and forwards regular vs scatter-gather descriptor flows.

## Integration Points

- Front-end descriptor ingestion for scheduler pipeline
- Bridges descriptor ring in host memory to on-chip command pipeline
- Produces SG list metadata for scatter-gather engine

## Verilog Source

```verilog
module dma_desc_fetch #(
    parameter DESC_WIDTH = 128,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [ADDR_WIDTH-1:0]    desc_base_addr,
    input  wire [15:0]              desc_ring_size,
    input  wire                     desc_fetch_en,
    output reg  [15:0]              desc_head,
    output reg  [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output reg                      pcie_rd_req,
    output wire [DESC_WIDTH-1:0]    desc_data,
    output wire                     desc_valid
);
// DMA Descriptor Fetch Module
// Fetches DMA descriptors from host memory via PCIe
module dma_desc_fetch #(
    parameter DESC_WIDTH = 128,
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Control interface
    input  wire [ADDR_WIDTH-1:0]    desc_base_addr,    // Descriptor ring base
    input  wire [15:0]              desc_ring_size,    // Ring size
    input  wire                     desc_fetch_en,     // Enable fetching
    output reg  [15:0]              desc_head,         // Current head pointer
    
    // PCIe read request interface
    output reg  [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output reg  [10:0]              pcie_rd_len,       // Length in DWORDs
    output reg                      pcie_rd_req,
    input  wire                     pcie_rd_ack,
    
    // PCIe read completion interface
    input  wire [DESC_WIDTH-1:0]    pcie_rd_data,
    input  wire                     pcie_rd_valid,
    output wire                     pcie_rd_ready,
    
    // Descriptor FIFO interface (regular descriptors)
    output wire [DESC_WIDTH-1:0]    desc_data,
    output wire                     desc_valid,
    input  wire                     desc_ready,
    
    // Scatter-Gather descriptor outputs
    output wire [DESC_WIDTH-1:0]    sg_desc_data,
    output wire                     sg_desc_valid,
    input  wire                     sg_desc_ready,
    output wire [ADDR_WIDTH-1:0]    sg_list_addr,
    output wire [7:0]               sg_list_count,
    output wire                     sg_list_valid,
    input  wire                     sg_list_ready
);

    // State machine
    localparam IDLE         = 3'd0;
    localparam REQ_DESC     = 3'd1;
    localparam WAIT_ACK     = 3'd2;
    localparam WAIT_DATA    = 3'd3;
    localparam FORWARD_DESC = 3'd4;
    
    reg [2:0] state;
    reg [DESC_WIDTH-1:0] desc_buffer;
    reg is_sg_descriptor;
    
    // Calculate descriptor address
    wire [ADDR_WIDTH-1:0] desc_addr = desc_base_addr + 
                                      (desc_head * (DESC_WIDTH/8));
    
    // Descriptor fields
    wire desc_valid_flag = desc_buffer[0];
    wire desc_sg_flag = desc_buffer[3];  // Bit 3 indicates SG operation
    
    // Extract SG list information from descriptor
    // For SG descriptors:
    //   Bits [47:16] contain SG list entry count (lower 8 bits)
    //   Bits [111:48] contain SG list base address (64 bits)
    wire [7:0] sg_entry_count = desc_buffer[23:16];
    wire [ADDR_WIDTH-1:0] sg_list_base = {{16{1'b0}}, desc_buffer[111:48]};
    
    // Output routing based on descriptor type
    assign desc_data = desc_buffer;
    assign desc_valid = (state == FORWARD_DESC) && desc_valid_flag && !is_sg_descriptor;

    assign sg_desc_data = desc_buffer;
    assign sg_desc_valid = (state == FORWARD_DESC) && desc_valid_flag && is_sg_descriptor;
    assign sg_list_addr = sg_list_base;
    assign sg_list_count = sg_entry_count;
    assign sg_list_valid = sg_desc_valid;

    // Ready only when waiting for completion data
    assign pcie_rd_ready = (state == WAIT_DATA);
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            desc_head <= 16'd0;
            pcie_rd_addr <= {ADDR_WIDTH{1'b0}};
            pcie_rd_len <= 11'd0;
            pcie_rd_req <= 1'b0;
            desc_buffer <= {DESC_WIDTH{1'b0}};
            is_sg_descriptor <= 1'b0;
        end else begin
            case (state)
                IDLE: begin
                    if (desc_fetch_en && (desc_head != desc_ring_size)) begin
                        state <= REQ_DESC;
                    end
                end
                
                REQ_DESC: begin
                    pcie_rd_addr <= desc_addr;
                    pcie_rd_len <= (DESC_WIDTH / 32);  // Convert to DWORDs
                    pcie_rd_req <= 1'b1;
                    state <= WAIT_ACK;
                end
                
                WAIT_ACK: begin
                    if (pcie_rd_ack) begin
                        pcie_rd_req <= 1'b0;
                        state <= WAIT_DATA;
                    end
                end
                
                WAIT_DATA: begin
                    if (pcie_rd_valid) begin
                        desc_buffer <= pcie_rd_data;
                        is_sg_descriptor <= pcie_rd_data[3];  // Check SG flag
                        state <= FORWARD_DESC;
                    end
                end
                
                FORWARD_DESC: begin
                    // Forward to regular or SG path based on descriptor type
                    if (is_sg_descriptor) begin
                        if (sg_desc_valid && sg_desc_ready && sg_list_ready) begin
                            // SG descriptor forwarded, increment head
                            if (desc_head == desc_ring_size - 1)
                                desc_head <= 16'd0;  // Wrap around
                            else
                                desc_head <= desc_head + 1'b1;
                            
                            state <= IDLE;
                        end
                    end else begin
                        if (desc_valid && desc_ready) begin
                            // Regular descriptor forwarded, increment head
                            if (desc_head == desc_ring_size - 1)
                                desc_head <= 16'd0;  // Wrap around
                            else
                                desc_head <= desc_head + 1'b1;
                            
                            state <= IDLE;
                        end
                    end
                end
                
                default: state <= IDLE;
            endcase
        end
    end
    
endmodule
endmodule
```
