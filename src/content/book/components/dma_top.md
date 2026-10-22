---
title: "DMA Engine Top — dma_top.v"
description: "Central DMA engine integrating descriptor fetch, scheduling, read/write datapaths, and completions."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/dma_top.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/dma_top.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/dma_top.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Engine Top — dma_top.v

**Filename:** `dma_engine/dma_top.v`

## Description

Top-level DMA integration module that wires descriptor fetch, scheduler, read/write engines, completion handling, and telemetry.

## Integration Points

- Main DMA subsystem boundary in FPGA top-level
- Connects PCIe, NVMe, interrupt, and control/status interfaces

## Verilog Source

```verilog
module dma_top #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64,
    parameter DESC_WIDTH = 128,
    parameter NUM_CHANNELS = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [ADDR_WIDTH-1:0]    desc_base_addr,
    input  wire [15:0]              desc_ring_size,
    input  wire                     desc_fetch_en,
    output wire [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output wire                     pcie_rd_req,
    output wire [ADDR_WIDTH-1:0]    pcie_wr_addr,
    output wire                     pcie_wr_valid,
    output wire                     interrupt_req
);
// DMA Engine Top Module
// Integrates all DMA components into a complete engine
module dma_top #(
    parameter DATA_WIDTH = 512,
    parameter ADDR_WIDTH = 64,
    parameter DESC_WIDTH = 128,
    parameter NUM_CHANNELS = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Configuration registers
    input  wire [ADDR_WIDTH-1:0]    desc_base_addr,
    input  wire [15:0]              desc_ring_size,
    input  wire                     desc_fetch_en,
    input  wire [ADDR_WIDTH-1:0]    cq_base_addr,
    input  wire [15:0]              cq_size,
    
    // PCIe interface - Read requests
    output wire [ADDR_WIDTH-1:0]    pcie_rd_addr,
    output wire [10:0]              pcie_rd_len,
    output wire                     pcie_rd_req,
    input  wire                     pcie_rd_ack,
    
    // PCIe interface - Read completions
    input  wire [DATA_WIDTH-1:0]    pcie_rd_data,
    input  wire                     pcie_rd_valid,
    output wire                     pcie_rd_ready,
    
    // PCIe interface - Write requests
    output wire [ADDR_WIDTH-1:0]    pcie_wr_addr,
    output wire [DATA_WIDTH-1:0]    pcie_wr_data,
    output wire [15:0]              pcie_wr_len,
    output wire                     pcie_wr_valid,
    input  wire                     pcie_wr_ready,
    
    // NVMe interface - Read requests
    output wire [ADDR_WIDTH-1:0]    nvme_rd_addr,
    output wire [15:0]              nvme_rd_len,
    output wire                     nvme_rd_req,
    input  wire                     nvme_rd_ack,
    
    // NVMe interface - Read data
    input  wire [DATA_WIDTH-1:0]    nvme_rd_data,
    input  wire                     nvme_rd_valid,
    output wire                     nvme_rd_ready,
    
    // NVMe interface - Write requests
    output wire [ADDR_WIDTH-1:0]    nvme_wr_addr,
    output wire [DATA_WIDTH-1:0]    nvme_wr_data,
    output wire [15:0]              nvme_wr_len,
    output wire                     nvme_wr_valid,
    input  wire                     nvme_wr_ready,
    
    // Interrupt output
    output wire                     interrupt_req,
    input  wire                     interrupt_ack,
    
    // Status outputs
    output wire [15:0]              desc_head,
    output wire [15:0]              cq_head,
    output wire [31:0]              scheduled_count,
    output wire [31:0]              completed_count,
    
    // Telemetry outputs
    output wire [NUM_CHANNELS-1:0]  telemetry_transfer_start,
    output wire [NUM_CHANNELS-1:0]  telemetry_transfer_complete,
    output wire [NUM_CHANNELS-1:0]  telemetry_transfer_error,
    output wire [31:0]              telemetry_bytes_transferred [0:NUM_CHANNELS-1],
    output wire [31:0]              telemetry_cycles [0:NUM_CHANNELS-1]
);

    // Internal signals
    wire [DESC_WIDTH-1:0] desc_fifo_data;
    wire                  desc_fifo_valid;
    wire                  desc_fifo_ready;
    
    // Scatter-gather signals
    wire [DESC_WIDTH-1:0] sg_desc_data;
    wire                  sg_desc_valid;
    wire                  sg_desc_ready;
    wire [ADDR_WIDTH-1:0] sg_list_addr;
    wire [7:0]            sg_list_count;
    wire                  sg_list_valid;
    wire                  sg_list_ready;
    
    wire [ADDR_WIDTH-1:0] cmd_src_addr [0:NUM_CHANNELS-1];
    wire [ADDR_WIDTH-1:0] cmd_dst_addr [0:NUM_CHANNELS-1];
    wire [31:0]           cmd_length [0:NUM_CHANNELS-1];
    wire [7:0]            cmd_flags [0:NUM_CHANNELS-1];
    wire [NUM_CHANNELS-1:0] cmd_valid;
    wire [NUM_CHANNELS-1:0] cmd_ready;
    wire [NUM_CHANNELS-1:0] channel_idle;

    // NVMe request signals are unused in this build; keep per-channel dummies to avoid multiple drivers
    wire [ADDR_WIDTH-1:0]   nvme_rd_addr_unused [0:(NUM_CHANNELS/2)-1];
    wire [15:0]             nvme_rd_len_unused  [0:(NUM_CHANNELS/2)-1];
    wire [(NUM_CHANNELS/2)-1:0] nvme_rd_req_unused;
    wire [(NUM_CHANNELS/2)-1:0] nvme_rd_ready_unused;
    
    wire [NUM_CHANNELS-1:0] completion_valid;
    wire [31:0]             completion_tag [0:NUM_CHANNELS-1];
    wire [NUM_CHANNELS-1:0] completion_ready;
    
    wire [ADDR_WIDTH-1:0] cq_wr_addr;
    wire [127:0]          cq_wr_data;
    wire                  cq_wr_req;
    wire                  cq_wr_ack;
    
    // Descriptor fetch module
    dma_desc_fetch #(
        .DESC_WIDTH(DESC_WIDTH),
        .ADDR_WIDTH(ADDR_WIDTH)
    ) desc_fetch_inst (
        .clk(clk),
        .rst_n(rst_n),
        .desc_base_addr(desc_base_addr),
        .desc_ring_size(desc_ring_size),
        .desc_fetch_en(desc_fetch_en),
        .desc_head(desc_head),
        .pcie_rd_addr(pcie_rd_addr),
        .pcie_rd_len(pcie_rd_len),
        .pcie_rd_req(pcie_rd_req),
        .pcie_rd_ack(pcie_rd_ack),
        .pcie_rd_data(pcie_rd_data[DESC_WIDTH-1:0]),
        .pcie_rd_valid(pcie_rd_valid),
        .pcie_rd_ready(pcie_rd_ready),
        .desc_data(desc_fifo_data),
        .desc_valid(desc_fifo_valid),
        .desc_ready(desc_fifo_ready),
        // Scatter-gather outputs
        .sg_desc_data(sg_desc_data),
        .sg_desc_valid(sg_desc_valid),
        .sg_desc_ready(sg_desc_ready),
        .sg_list_addr(sg_list_addr),
        .sg_list_count(sg_list_count),
        .sg_list_valid(sg_list_valid),
        .sg_list_ready(sg_list_ready)
    );
    
    // DMA scheduler
    dma_scheduler #(
        .DESC_WIDTH(DESC_WIDTH),
        .ADDR_WIDTH(ADDR_WIDTH),
        .NUM_CHANNELS(NUM_CHANNELS)
    ) scheduler_inst (
        .clk(clk),
        .rst_n(rst_n),
        .desc_data(desc_fifo_data),
        .desc_valid(desc_fifo_valid),
        .desc_ready(desc_fifo_ready),
        .channel_idle(channel_idle),
        .cmd_src_addr(cmd_src_addr),
        .cmd_dst_addr(cmd_dst_addr),
        .cmd_length(cmd_length),
        .cmd_flags(cmd_flags),
        .cmd_valid(cmd_valid),
        .cmd_ready(cmd_ready),
        .scheduled_count(scheduled_count),
        .pending_count()
    );
    
    // Generate read and write engines for each channel
    genvar i;
    generate
        for (i = 0; i < NUM_CHANNELS/2; i = i + 1) begin : gen_read_engines
            wire rd_busy;
            
            dma_read_engine #(
                .DATA_WIDTH(DATA_WIDTH),
                .ADDR_WIDTH(ADDR_WIDTH)
            ) read_engine_inst (
                .clk(clk),
                .rst_n(rst_n),
                .cmd_src_addr(cmd_src_addr[i]),
                .cmd_dst_addr(cmd_dst_addr[i]),
                .cmd_length(cmd_length[i]),
                .cmd_flags(cmd_flags[i]),
                .cmd_valid(cmd_valid[i]),
                .cmd_ready(cmd_ready[i]),
                .nvme_rd_addr(nvme_rd_addr_unused[i]),
                .nvme_rd_len(nvme_rd_len_unused[i]),
                .nvme_rd_req(nvme_rd_req_unused[i]),
                .nvme_rd_ack(nvme_rd_ack),
                .nvme_rd_data(nvme_rd_data),
                .nvme_rd_valid(nvme_rd_valid),
                .nvme_rd_ready(nvme_rd_ready_unused[i]),
                .pcie_wr_addr(pcie_wr_addr),
                .pcie_wr_data(pcie_wr_data),
                .pcie_wr_len(pcie_wr_len),
                .pcie_wr_valid(pcie_wr_valid),
                .pcie_wr_ready(pcie_wr_ready),
                .completion_valid(completion_valid[i]),
                .completion_tag(completion_tag[i]),
                .completion_ready(completion_ready[i]),
                .busy(rd_busy),
                // Telemetry outputs
                .telemetry_transfer_start(telemetry_transfer_start[i]),
                .telemetry_transfer_complete(telemetry_transfer_complete[i]),
                .telemetry_transfer_error(telemetry_transfer_error[i]),
                .telemetry_bytes_transferred(telemetry_bytes_transferred[i]),
                .telemetry_cycles(telemetry_cycles[i])
            );
            
            assign channel_idle[i] = !rd_busy;
        end
        
        for (i = NUM_CHANNELS/2; i < NUM_CHANNELS; i = i + 1) begin : gen_write_engines
            wire wr_busy;
            
            // Note: Write engines in this simplified design do not fetch data from host
            // In production, write engines would use separate PCIe read channels or
            // share read channels with read engines through an arbiter/mux.
            // For now, write data is assumed to be pre-loaded in FIFOs.
            
            dma_write_engine #(
                .DATA_WIDTH(DATA_WIDTH),
                .ADDR_WIDTH(ADDR_WIDTH)
            ) write_engine_inst (
                .clk(clk),
                .rst_n(rst_n),
                .cmd_src_addr(cmd_src_addr[i]),
                .cmd_dst_addr(cmd_dst_addr[i]),
                .cmd_length(cmd_length[i]),
                .cmd_flags(cmd_flags[i]),
                .cmd_valid(cmd_valid[i]),
                .cmd_ready(cmd_ready[i]),
                .pcie_rd_addr(),  // Not connected in this simplified version
                .pcie_rd_len(),
                .pcie_rd_req(),
                .pcie_rd_ack(1'b0),
                .pcie_rd_data(pcie_rd_data),
                .pcie_rd_valid(pcie_rd_valid),
                .pcie_rd_ready(),
                .nvme_wr_addr(nvme_wr_addr),
                .nvme_wr_data(nvme_wr_data),
                .nvme_wr_len(nvme_wr_len),
                .nvme_wr_valid(nvme_wr_valid),
                .nvme_wr_ready(nvme_wr_ready),
                .completion_valid(completion_valid[i]),
                .completion_tag(completion_tag[i]),
                .completion_ready(completion_ready[i]),
                .busy(wr_busy),
                // Telemetry outputs
                .telemetry_transfer_start(telemetry_transfer_start[i]),
                .telemetry_transfer_complete(telemetry_transfer_complete[i]),
                .telemetry_transfer_error(telemetry_transfer_error[i]),
                .telemetry_bytes_transferred(telemetry_bytes_transferred[i]),
                .telemetry_cycles(telemetry_cycles[i])
            );
            
            assign channel_idle[i] = !wr_busy;
        end
    endgenerate
    
    // Completion handler
    dma_completion #(
        .ADDR_WIDTH(ADDR_WIDTH),
        .NUM_CHANNELS(NUM_CHANNELS)
    ) completion_inst (
        .clk(clk),
        .rst_n(rst_n),
        .completion_valid(completion_valid),
        .completion_tag(completion_tag),
        .completion_ready(completion_ready),
        .cq_wr_addr(cq_wr_addr),
        .cq_wr_data(cq_wr_data),
        .cq_wr_req(cq_wr_req),
        .cq_wr_ack(cq_wr_ack),
        .interrupt_req(interrupt_req),
        .interrupt_ack(interrupt_ack),
        .cq_base_addr(cq_base_addr),
        .cq_size(cq_size),
        .cq_head(cq_head),
        .completed_count(completed_count)
    );
    
    // Connect completion queue writes to PCIe (simplified)
    assign cq_wr_ack = cq_wr_req;  // Immediate ack for now
    
    // Scatter-gather engine connection note:
    // The SG engine signals are now available from descriptor fetch.
    // In a full implementation, the SG engine would:
    // 1. Receive sg_desc_data/sg_desc_valid from descriptor fetch
    // 2. Fetch the SG list from sg_list_addr
    // 3. Decompose into multiple DMA commands
    // 4. Feed decomposed commands to the scheduler
    //
    // For now, tie off SG engine outputs (SG descriptors will be ignored)
    assign sg_desc_ready = 1'b1;  // Always ready to accept (and discard) SG descriptors
    assign sg_list_ready = 1'b1;  // Always ready for SG list info

        // NVMe interface is not driven in this configuration
        assign nvme_rd_addr  = {ADDR_WIDTH{1'b0}};
        assign nvme_rd_len   = 16'd0;
        assign nvme_rd_req   = 1'b0;
        assign nvme_rd_ready = 1'b0;
        assign nvme_wr_addr  = {ADDR_WIDTH{1'b0}};
        assign nvme_wr_data  = {DATA_WIDTH{1'b0}};
        assign nvme_wr_len   = 16'd0;
        assign nvme_wr_valid = 1'b0;

endmodule
endmodule
```
