---
title: "Scatter-Gather Engine — scatter_gather_engine.v"
description: "Traverses chained scatter-gather descriptor lists across fragmented host physical memory pages."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/scatter_gather_engine.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/scatter_gather_engine.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/scatter_gather_engine.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Scatter-Gather Engine — scatter_gather_engine.v

**Filename:** `dma_engine/scatter_gather_engine.v`

## Description

Handles chained scatter-gather DMA descriptors, fetching SG entry lists and emitting decomposed sequential DMA commands.

## Integration Points

- Consumes SG descriptors from descriptor fetch path
- Fetches SG entries over PCIe and feeds command stream to DMA engines
- Tracks SG progress/completion/error status

## Verilog Source

```verilog
module scatter_gather_engine #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 512,
    parameter DESC_WIDTH = 128,
    parameter MAX_SG_ENTRIES = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [DESC_WIDTH-1:0]    desc_data,
    input  wire                     desc_valid,
    output reg                      desc_ready,
    input  wire [ADDR_WIDTH-1:0]    sg_list_addr,
    input  wire [7:0]               sg_list_count,
    output reg  [ADDR_WIDTH-1:0]    dma_src_addr,
    output reg  [ADDR_WIDTH-1:0]    dma_dst_addr,
    output reg  [31:0]              dma_length,
    output reg                      dma_valid
);
// Scatter-Gather Engine
// Handles scatter-gather DMA operations with chained descriptors
// Supports both scatter (write to multiple non-contiguous destinations)
// and gather (read from multiple non-contiguous sources)
module scatter_gather_engine #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 512,
    parameter DESC_WIDTH = 128,
    parameter MAX_SG_ENTRIES = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Descriptor input
    input  wire [DESC_WIDTH-1:0]    desc_data,
    input  wire                     desc_valid,
    output reg                      desc_ready,
    
    // Scatter-gather list from memory
    input  wire [ADDR_WIDTH-1:0]    sg_list_addr,
    input  wire [7:0]               sg_list_count,
    input  wire                     sg_list_valid,
    output reg                      sg_list_ready,
    
    // PCIe read interface for fetching SG entries
    output reg  [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output reg  [10:0]              pcie_rd_len,
    output reg                      pcie_rd_req,
    input  wire                     pcie_rd_ack,
    input  wire [DATA_WIDTH-1:0]    pcie_rd_data,
    input  wire                     pcie_rd_valid,
    output reg                      pcie_rd_ready,
    
    // DMA command output (decomposed into sequential transfers)
    output reg  [ADDR_WIDTH-1:0]    dma_src_addr,
    output reg  [ADDR_WIDTH-1:0]    dma_dst_addr,
    output reg  [31:0]              dma_length,
    output reg  [7:0]               dma_flags,
    output reg                      dma_valid,
    input  wire                     dma_ready,
    
    // Status
    output reg  [7:0]               sg_entries_processed,
    output reg                      sg_operation_complete,
    output reg                      sg_error
);

    // Scatter-gather entry format (128 bits each)
    // [63:0]   - Address
    // [95:64]  - Length
    // [127:96] - Flags/Reserved
    
    // State machine
    localparam IDLE = 3'd0;
    localparam FETCH_SG_LIST = 3'd1;
    localparam PARSE_SG_ENTRY = 3'd2;
    localparam ISSUE_DMA = 3'd3;
    localparam COMPLETE = 3'd4;
    
    reg [2:0] state;
    reg [DESC_WIDTH-1:0] current_desc;
    reg [ADDR_WIDTH-1:0] current_sg_list_addr;
    reg [7:0] total_sg_entries;
    reg [7:0] current_sg_entry;
    integer i;

    localparam integer ENTRIES_PER_BEAT = DATA_WIDTH / 128;
    
    // Temporary variables for SG entry parsing
    reg [127:0] entry_temp;
    reg [ADDR_WIDTH-1:0] entry_addr_temp;
    reg [31:0] entry_len_temp;
    
    // SG entry buffer
    reg [127:0] sg_entries [0:MAX_SG_ENTRIES-1];
    reg [4:0] sg_entry_wr_idx;
    reg [4:0] sg_entry_rd_idx;
    reg sg_entries_fetched;
    
    // Descriptor fields
    wire desc_is_scatter_gather = current_desc[3];  // Bit 3 indicates SG operation
    wire desc_is_write = current_desc[1];
    wire [7:0] desc_flags = current_desc[15:8];
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            desc_ready <= 1'b1;
            sg_list_ready <= 1'b0;
            pcie_rd_addr <= {ADDR_WIDTH{1'b0}};
            pcie_rd_len <= 11'd0;
            pcie_rd_req <= 1'b0;
            pcie_rd_ready <= 1'b0;
            dma_src_addr <= {ADDR_WIDTH{1'b0}};
            dma_dst_addr <= {ADDR_WIDTH{1'b0}};
            dma_length <= 32'd0;
            dma_flags <= 8'd0;
            dma_valid <= 1'b0;
            sg_entries_processed <= 8'd0;
            sg_operation_complete <= 1'b0;
            sg_error <= 1'b0;
            current_desc <= {DESC_WIDTH{1'b0}};
            current_sg_list_addr <= {ADDR_WIDTH{1'b0}};
            total_sg_entries <= 8'd0;
            current_sg_entry <= 8'd0;
            sg_entry_wr_idx <= 5'd0;
            sg_entry_rd_idx <= 5'd0;
            sg_entries_fetched <= 1'b0;
        end else begin
            case (state)
                IDLE: begin
                    desc_ready <= 1'b1;
                    sg_operation_complete <= 1'b0;
                    sg_error <= 1'b0;
                    sg_entries_processed <= 8'd0;
                    
                    if (desc_valid && desc_ready) begin
                        current_desc <= desc_data;
                        desc_ready <= 1'b0;
                        
                        // Check if this is a scatter-gather operation
                        if (desc_data[3]) begin
                            // SG operation
                            sg_list_ready <= 1'b1;
                            state <= FETCH_SG_LIST;
                        end else begin
                            // Regular single-buffer DMA
                            // Pass through to DMA engine
                            dma_src_addr <= {{16{1'b0}}, desc_data[63:16]};
                            dma_dst_addr <= {{16{1'b0}}, desc_data[111:64]};
                            dma_length <= desc_data[47:16];
                            dma_flags <= desc_data[15:8];
                            dma_valid <= 1'b1;
                            state <= COMPLETE;
                        end
                    end
                end
                
                FETCH_SG_LIST: begin
                    if (sg_list_valid && sg_list_ready) begin
                        current_sg_list_addr <= sg_list_addr;
                        total_sg_entries <= sg_list_count;
                        sg_list_ready <= 1'b0;
                        
                        if (sg_list_count > MAX_SG_ENTRIES) begin
                            // Error: too many SG entries
                            sg_error <= 1'b1;
                            state <= COMPLETE;
                        end else if (sg_list_count == 0) begin
                            // Error: no SG entries
                            sg_error <= 1'b1;
                            state <= COMPLETE;
                        end else begin
                            // Fetch SG entries from memory
                            pcie_rd_addr <= sg_list_addr;
                            pcie_rd_len <= sg_list_count * 16; // 16 bytes per entry
                            pcie_rd_req <= 1'b1;
                            pcie_rd_ready <= 1'b1;
                            sg_entry_wr_idx <= 5'd0;
                            sg_entries_fetched <= 1'b0;
                            current_sg_entry <= 8'd0;
                        end
                    end
                    
                    // Receive SG entries
                    if (pcie_rd_ack) begin
                        pcie_rd_req <= 1'b0;
                    end
                    
                    if (pcie_rd_valid && pcie_rd_ready) begin
                        // Store SG entries packed in the PCIe completion beat
                        for (i = 0; i < ENTRIES_PER_BEAT; i = i + 1) begin
                            if (sg_entry_wr_idx + i < total_sg_entries) begin
                                sg_entries[sg_entry_wr_idx + i] <= pcie_rd_data[(i*128)+:128];
                            end
                        end

                        sg_entry_wr_idx <= sg_entry_wr_idx + ENTRIES_PER_BEAT;
                        
                        if (sg_entry_wr_idx + ENTRIES_PER_BEAT >= total_sg_entries) begin
                            // All entries fetched
                            pcie_rd_ready <= 1'b0;
                            sg_entries_fetched <= 1'b1;
                            sg_entry_rd_idx <= 5'd0;
                            state <= PARSE_SG_ENTRY;
                        end
                    end
                end
                
                PARSE_SG_ENTRY: begin
                    if (sg_entries_fetched && current_sg_entry < total_sg_entries) begin
                        // Parse current SG entry
                        entry_temp = sg_entries[sg_entry_rd_idx];
                        entry_addr_temp = entry_temp[63:0];
                        entry_len_temp = entry_temp[95:64];
                        
                        // Issue DMA for this segment
                        if (desc_is_write) begin
                            // Scatter operation: read from single source, write to multiple destinations
                            dma_src_addr <= {{16{1'b0}}, current_desc[63:16]};
                            dma_dst_addr <= entry_addr_temp;
                        end else begin
                            // Gather operation: read from multiple sources, write to single destination
                            dma_src_addr <= entry_addr_temp;
                            dma_dst_addr <= {{16{1'b0}}, current_desc[111:64]};
                        end
                        dma_length <= entry_len_temp;
                        dma_flags <= desc_flags;
                        dma_valid <= 1'b1;
                        state <= ISSUE_DMA;
                    end else begin
                        // All SG entries processed
                        sg_operation_complete <= 1'b1;
                        state <= COMPLETE;
                    end
                end
                
                ISSUE_DMA: begin
                    if (dma_ready) begin
                        dma_valid <= 1'b0;
                        sg_entries_processed <= sg_entries_processed + 1;
                        current_sg_entry <= current_sg_entry + 1;
                        sg_entry_rd_idx <= sg_entry_rd_idx + 1;
                        state <= PARSE_SG_ENTRY;
                    end
                end
                
                COMPLETE: begin
                    if (dma_ready || sg_operation_complete || sg_error) begin
                        dma_valid <= 1'b0;
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
