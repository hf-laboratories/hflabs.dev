---
title: "Agent Message Router — agent_message_router.v"
description: "Routes inter-agent messages with FIFO buffering, priority support, and zero-copy transfer coordination."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/agent_message_router.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/agent_message_router.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/agent_message_router.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Agent Message Router — agent_message_router.v

**Filename:** `dma_engine/agent_message_router.v`

## Description

Routes inter-agent messages with FIFO buffering, priority support, and zero-copy transfer coordination via DMA-safe buffer metadata.

## Integration Points

- Agent-to-agent control/data messaging fabric
- Zero-copy handoff interface to DMA transfer engine
- Produces routing and transfer telemetry counters

## Verilog Source

```verilog
module agent_message_router #(
    parameter NUM_AGENTS = 16,
    parameter MSG_WIDTH = 256,
    parameter FIFO_DEPTH = 8,
    parameter ADDR_WIDTH = 4
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [NUM_AGENTS-1:0]    msg_in_valid,
    input  wire [MSG_WIDTH-1:0]     msg_in_data [0:NUM_AGENTS-1],
    input  wire [ADDR_WIDTH-1:0]    msg_in_dest [0:NUM_AGENTS-1],
    input  wire [2:0]               msg_in_priority [0:NUM_AGENTS-1],
    output reg  [NUM_AGENTS-1:0]    msg_in_ready,
    output reg                      zcopy_transfer_valid,
    output reg  [63:0]              zcopy_buffer_iova,
    output reg  [31:0]              zcopy_buffer_size
);
// Agent Message Router with Zero-Copy DMA Support
// Routes messages between agents in the multi-agent system
// Supports priority-based routing, message queuing, and zero-copy buffer transfers
// 
// Message format for zero-copy transfers:
//   [255:248] = Message type (0 = data, 1 = buffer_transfer, 2 = buffer_ack)
//   [247:184] = Buffer IOVA address (64-bit DMA-safe address)
//   [183:152] = Buffer size (32-bit)
//   [151:120] = Transfer tag (32-bit for tracking)
//   [119:0]   = Payload data or additional metadata
//
module agent_message_router #(
    parameter NUM_AGENTS = 16,
    parameter MSG_WIDTH = 256,
    parameter FIFO_DEPTH = 8,
    parameter ADDR_WIDTH = 4  // log2(NUM_AGENTS)
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Input messages from agents
    input  wire [NUM_AGENTS-1:0]    msg_in_valid,
    input  wire [MSG_WIDTH-1:0]     msg_in_data [0:NUM_AGENTS-1],
    input  wire [ADDR_WIDTH-1:0]    msg_in_dest [0:NUM_AGENTS-1],
    input  wire [2:0]               msg_in_priority [0:NUM_AGENTS-1],
    output reg  [NUM_AGENTS-1:0]    msg_in_ready,
    
    // Output messages to agents
    output reg  [NUM_AGENTS-1:0]    msg_out_valid,
    output reg  [MSG_WIDTH-1:0]     msg_out_data [0:NUM_AGENTS-1],
    output reg  [ADDR_WIDTH-1:0]    msg_out_src [0:NUM_AGENTS-1],
    output reg  [2:0]               msg_out_priority [0:NUM_AGENTS-1],
    input  wire [NUM_AGENTS-1:0]    msg_out_ready,
    
    // Zero-copy buffer transfer interface (connects to DMA engine)
    output reg                      zcopy_transfer_valid,
    output reg  [ADDR_WIDTH-1:0]    zcopy_src_agent,
    output reg  [ADDR_WIDTH-1:0]    zcopy_dst_agent,
    output reg  [63:0]              zcopy_buffer_iova,
    output reg  [31:0]              zcopy_buffer_size,
    output reg  [31:0]              zcopy_transfer_tag,
    input  wire                     zcopy_transfer_ready,
    input  wire                     zcopy_transfer_done,
    input  wire [31:0]              zcopy_transfer_status,
    
    // Router statistics
    output reg  [31:0]              total_messages_routed,
    output reg  [31:0]              messages_dropped,
    output reg  [31:0]              zcopy_transfers_initiated,
    output reg  [31:0]              zcopy_transfers_completed,
    output reg  [NUM_AGENTS-1:0]    agent_busy
);

    // Message type definitions
    localparam MSG_TYPE_DATA           = 8'h00;
    localparam MSG_TYPE_BUFFER_XFER    = 8'h01;
    localparam MSG_TYPE_BUFFER_ACK     = 8'h02;
    localparam MSG_TYPE_BUFFER_RELEASE = 8'h03;

    // Message FIFO for each agent
    reg [MSG_WIDTH-1:0] fifo_data [0:NUM_AGENTS-1][0:FIFO_DEPTH-1];
    reg [ADDR_WIDTH-1:0] fifo_src [0:NUM_AGENTS-1][0:FIFO_DEPTH-1];
    reg [2:0] fifo_priority [0:NUM_AGENTS-1][0:FIFO_DEPTH-1];
    reg [3:0] fifo_wr_ptr [0:NUM_AGENTS-1];
    reg [3:0] fifo_rd_ptr [0:NUM_AGENTS-1];
    reg [3:0] fifo_count [0:NUM_AGENTS-1];
    
    // Zero-copy transfer tracking
    reg [31:0] pending_zcopy_tag;
    reg [ADDR_WIDTH-1:0] pending_zcopy_src;
    reg [ADDR_WIDTH-1:0] pending_zcopy_dst;
    reg pending_zcopy_active;
    
    // FIFO full/empty flags
    wire [NUM_AGENTS-1:0] fifo_full;
    wire [NUM_AGENTS-1:0] fifo_empty;
    
    genvar i;
    generate
        for (i = 0; i < NUM_AGENTS; i = i + 1) begin : gen_fifo_flags
            assign fifo_full[i] = (fifo_count[i] == FIFO_DEPTH);
            assign fifo_empty[i] = (fifo_count[i] == 0);
        end
    endgenerate
    
    // Routing logic
    integer j, k;
    
    // Helper wires for message parsing
    wire [7:0] msg_type_extract [0:NUM_AGENTS-1];
    wire [63:0] buffer_iova_extract [0:NUM_AGENTS-1];
    wire [31:0] buffer_size_extract [0:NUM_AGENTS-1];
    wire [31:0] transfer_tag_extract [0:NUM_AGENTS-1];
    
    generate
        for (i = 0; i < NUM_AGENTS; i = i + 1) begin : gen_msg_extract
            assign msg_type_extract[i] = msg_in_data[i][255:248];
            assign buffer_iova_extract[i] = msg_in_data[i][247:184];
            assign buffer_size_extract[i] = msg_in_data[i][183:152];
            assign transfer_tag_extract[i] = msg_in_data[i][151:120];
        end
    endgenerate
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            // Reset all FIFOs
            for (j = 0; j < NUM_AGENTS; j = j + 1) begin
                fifo_wr_ptr[j] <= 4'd0;
                fifo_rd_ptr[j] <= 4'd0;
                fifo_count[j] <= 4'd0;
                msg_out_valid[j] <= 1'b0;
                msg_out_data[j] <= {MSG_WIDTH{1'b0}};
                msg_out_src[j] <= {ADDR_WIDTH{1'b0}};
                msg_out_priority[j] <= 3'd0;
            end
            msg_in_ready <= {NUM_AGENTS{1'b0}};
            total_messages_routed <= 32'd0;
            messages_dropped <= 32'd0;
            zcopy_transfers_initiated <= 32'd0;
            zcopy_transfers_completed <= 32'd0;
            agent_busy <= {NUM_AGENTS{1'b0}};
            
            // Zero-copy interface reset
            zcopy_transfer_valid <= 1'b0;
            zcopy_src_agent <= {ADDR_WIDTH{1'b0}};
            zcopy_dst_agent <= {ADDR_WIDTH{1'b0}};
            zcopy_buffer_iova <= 64'd0;
            zcopy_buffer_size <= 32'd0;
            zcopy_transfer_tag <= 32'd0;
            pending_zcopy_active <= 1'b0;
            pending_zcopy_tag <= 32'd0;
            pending_zcopy_src <= {ADDR_WIDTH{1'b0}};
            pending_zcopy_dst <= {ADDR_WIDTH{1'b0}};
        end else begin
            // Handle zero-copy transfer completion
            if (zcopy_transfer_done && pending_zcopy_active) begin
                // Generate acknowledgment message to source agent
                if (!fifo_full[pending_zcopy_src]) begin
                    fifo_data[pending_zcopy_src][fifo_wr_ptr[pending_zcopy_src]][255:248] <= MSG_TYPE_BUFFER_ACK;
                    fifo_data[pending_zcopy_src][fifo_wr_ptr[pending_zcopy_src]][151:120] <= pending_zcopy_tag;
                    fifo_data[pending_zcopy_src][fifo_wr_ptr[pending_zcopy_src]][119:88] <= zcopy_transfer_status;
                    fifo_src[pending_zcopy_src][fifo_wr_ptr[pending_zcopy_src]] <= pending_zcopy_dst;
                    fifo_priority[pending_zcopy_src][fifo_wr_ptr[pending_zcopy_src]] <= 3'd7; // High priority for ACKs
                    fifo_wr_ptr[pending_zcopy_src] <= (fifo_wr_ptr[pending_zcopy_src] + 1) & (FIFO_DEPTH - 1);
                    fifo_count[pending_zcopy_src] <= fifo_count[pending_zcopy_src] + 1;
                end
                zcopy_transfers_completed <= zcopy_transfers_completed + 1;
                pending_zcopy_active <= 1'b0;
                zcopy_transfer_valid <= 1'b0;
            end
            
            // Input side: Route incoming messages to destination FIFOs
            for (j = 0; j < NUM_AGENTS; j = j + 1) begin
                msg_in_ready[j] <= 1'b0;
                
                if (msg_in_valid[j]) begin
                    if (msg_in_dest[j] < NUM_AGENTS) begin
                        // Check if this is a zero-copy buffer transfer request
                        if (msg_type_extract[j] == MSG_TYPE_BUFFER_XFER && !pending_zcopy_active && zcopy_transfer_ready) begin
                            // Initiate zero-copy DMA transfer
                            zcopy_transfer_valid <= 1'b1;
                            zcopy_src_agent <= j;
                            zcopy_dst_agent <= msg_in_dest[j];
                            zcopy_buffer_iova <= buffer_iova_extract[j];
                            zcopy_buffer_size <= buffer_size_extract[j];
                            zcopy_transfer_tag <= transfer_tag_extract[j];
                            
                            pending_zcopy_active <= 1'b1;
                            pending_zcopy_tag <= transfer_tag_extract[j];
                            pending_zcopy_src <= j;
                            pending_zcopy_dst <= msg_in_dest[j];
                            
                            zcopy_transfers_initiated <= zcopy_transfers_initiated + 1;
                            msg_in_ready[j] <= 1'b1;
                            total_messages_routed <= total_messages_routed + 1;
                        end else if (!fifo_full[msg_in_dest[j]]) begin
                            // Standard message routing - FIFO has space, enqueue message
                            fifo_data[msg_in_dest[j]][fifo_wr_ptr[msg_in_dest[j]]] <= msg_in_data[j];
                            fifo_src[msg_in_dest[j]][fifo_wr_ptr[msg_in_dest[j]]] <= j;
                            fifo_priority[msg_in_dest[j]][fifo_wr_ptr[msg_in_dest[j]]] <= msg_in_priority[j];
                            fifo_wr_ptr[msg_in_dest[j]] <= (fifo_wr_ptr[msg_in_dest[j]] + 1) & (FIFO_DEPTH - 1);
                            fifo_count[msg_in_dest[j]] <= fifo_count[msg_in_dest[j]] + 1;
                            msg_in_ready[j] <= 1'b1;
                            total_messages_routed <= total_messages_routed + 1;
                        end else begin
                            // FIFO full, drop message
                            messages_dropped <= messages_dropped + 1;
                        end
                    end else begin
                        // Invalid destination, drop message
                        messages_dropped <= messages_dropped + 1;
                    end
                end
            end
            
            // Output side: Dequeue messages from FIFOs
            for (k = 0; k < NUM_AGENTS; k = k + 1) begin
                if (!fifo_empty[k] && (!msg_out_valid[k] || msg_out_ready[k])) begin
                    // Dequeue message
                    msg_out_data[k] <= fifo_data[k][fifo_rd_ptr[k]];
                    msg_out_src[k] <= fifo_src[k][fifo_rd_ptr[k]];
                    msg_out_priority[k] <= fifo_priority[k][fifo_rd_ptr[k]];
                    msg_out_valid[k] <= 1'b1;
                    fifo_rd_ptr[k] <= (fifo_rd_ptr[k] + 1) & (FIFO_DEPTH - 1);
                    fifo_count[k] <= fifo_count[k] - 1;
                    agent_busy[k] <= 1'b1;
                end else if (msg_out_ready[k]) begin
                    // Clear valid when message is accepted
                    msg_out_valid[k] <= 1'b0;
                    agent_busy[k] <= 1'b0;
                end
            end
        end
    end

endmodule
endmodule
```
