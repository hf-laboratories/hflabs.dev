---
title: "MSI-X Controller — msix_ctrl.v"
description: "16-vector MSI-X interrupt controller managing vector tables, pending bits, and PCIe interrupt TLPs."
part: "Part II — Component Library"
chapter: "Interrupt Controller Components"
category: "Interrupt Controller Components"
filename: "interrupt/msix_ctrl.v"
order: 100
tags: ["Interrupt Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/msix_ctrl.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/interrupt/msix_ctrl.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# MSI-X Controller — msix_ctrl.v

**Filename:** `interrupt/msix_ctrl.v`

## Description

Implements MSI-X interrupt control for PCIe endpoint integration, including vector management, pending handling, and interrupt dispatch signaling.

## Integration Points

- Connects interrupt sources from DMA/engine subsystems to PCIe MSI-X signaling path
- Exposes control/status configuration hooks for vector enable/mask behavior
- Feeds host interrupt handling through MSI-X table/PBA semantics

## Verilog Source

```verilog
module msix_ctrl #(
    parameter NUM_VECTORS = 32,
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 32
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [NUM_VECTORS-1:0]       irq_req,
    output reg  [NUM_VECTORS-1:0]       irq_ack,
    input  wire [31:0]                  cfg_addr,
    input  wire [31:0]                  cfg_wdata,
    input  wire                         cfg_wr_en,
    input  wire                         cfg_rd_en,
    output reg  [31:0]                  cfg_rdata,
    output reg                          cfg_rvalid,
    output reg                          msix_valid,
    input  wire                         msix_ready,
    output reg  [ADDR_WIDTH-1:0]        msix_addr,
    output reg  [DATA_WIDTH-1:0]        msix_data
);
// MSI-X Interrupt Controller
// Manages MSI-X interrupt vectors and table
module msix_ctrl #(
    parameter NUM_VECTORS = 16,
    parameter TABLE_SIZE = NUM_VECTORS * 4,  // 4 DWORDs per entry
    parameter ADDR_WIDTH = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Configuration
    input  wire                     msix_enable,
    input  wire                     msix_mask,       // Global mask
    
    // Interrupt requests (from various sources)
    input  wire [NUM_VECTORS-1:0]   int_req,
    output reg  [NUM_VECTORS-1:0]   int_ack,
    
    // MSI-X table access (for host configuration)
    input  wire [7:0]               table_addr,      // Entry index * 16
    input  wire [31:0]              table_wr_data,
    input  wire [1:0]               table_wr_dword,  // Which DWORD (0-3)
    input  wire                     table_wr_en,
    input  wire                     table_rd_en,
    output reg  [31:0]              table_rd_data,
    
    // MSI-X message interface (to PCIe)
    output reg  [ADDR_WIDTH-1:0]    msi_addr,
    output reg  [31:0]              msi_data,
    output reg                      msi_req,
    input  wire                     msi_ack_in,
    
    // Status
    output reg  [31:0]              int_count,
    output reg  [NUM_VECTORS-1:0]   pending_ints
);

    // MSI-X table entry format (16 bytes = 4 DWORDs):
    // DWORD 0: Message address lower 32 bits
    // DWORD 1: Message address upper 32 bits
    // DWORD 2: Message data
    // DWORD 3: Vector control (bit 0 = mask)
    
    reg [31:0] msix_table [0:TABLE_SIZE-1];
    
    // Per-vector state
    reg [NUM_VECTORS-1:0] vector_mask;
    reg [NUM_VECTORS-1:0] vector_pending;
    
    wire [7:0] table_entry_idx = table_addr[7:4];  // Divide by 16
    wire [1:0] table_dword_idx = table_addr[3:2];  // DWORD within entry
    
    integer i;
    
    // Initialize MSI-X table
    initial begin
        for (i = 0; i < TABLE_SIZE; i = i + 1) begin
            msix_table[i] = 32'd0;
        end
    end
    
    // Table write access
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            for (i = 0; i < TABLE_SIZE; i = i + 1) begin
                msix_table[i] <= 32'd0;
            end
        end else if (table_wr_en && table_entry_idx < NUM_VECTORS) begin
            msix_table[table_entry_idx * 4 + table_wr_dword] <= table_wr_data;
        end
    end
    
    // Table read access
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            table_rd_data <= 32'd0;
        end else if (table_rd_en && table_entry_idx < NUM_VECTORS) begin
            table_rd_data <= msix_table[table_entry_idx * 4 + table_dword_idx];
        end else begin
            table_rd_data <= 32'd0;
        end
    end
    
    // Extract vector masks from table
    always @(*) begin
        for (i = 0; i < NUM_VECTORS; i = i + 1) begin
            vector_mask[i] = msix_table[i * 4 + 3][0];  // Bit 0 of DWORD 3
        end
    end
    
    // Interrupt state machine
    localparam IDLE         = 2'd0;
    localparam SELECT_VEC   = 2'd1;
    localparam SEND_MSI     = 2'd2;
    localparam WAIT_ACK     = 2'd3;
    
    reg [1:0] state;
    reg [3:0] selected_vector;
    reg [3:0] priority_ptr;
    
    // Priority encoder for pending interrupts
    always @(*) begin
        selected_vector = 0;
        for (i = 0; i < NUM_VECTORS; i = i + 1) begin
            if (vector_pending[i] && !vector_mask[i]) begin
                selected_vector = i;
            end
        end
    end
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            vector_pending <= {NUM_VECTORS{1'b0}};
            pending_ints <= {NUM_VECTORS{1'b0}};
            int_ack <= {NUM_VECTORS{1'b0}};
            msi_req <= 1'b0;
            msi_addr <= {ADDR_WIDTH{1'b0}};
            msi_data <= 32'd0;
            int_count <= 32'd0;
            priority_ptr <= 4'd0;
        end else begin
            // Capture interrupt requests
            vector_pending <= vector_pending | int_req;
            pending_ints <= vector_pending;
            
            case (state)
                IDLE: begin
                    int_ack <= {NUM_VECTORS{1'b0}};
                    
                    if (msix_enable && !msix_mask) begin
                        // Check for pending unmasked interrupts
                        if (|(vector_pending & ~vector_mask)) begin
                            state <= SELECT_VEC;
                        end
                    end
                end
                
                SELECT_VEC: begin
                    if (vector_pending[selected_vector] && !vector_mask[selected_vector]) begin
                        // Load MSI-X table entry for this vector
                        msi_addr[31:0]  <= msix_table[selected_vector * 4 + 0];
                        msi_addr[63:32] <= msix_table[selected_vector * 4 + 1];
                        msi_data        <= msix_table[selected_vector * 4 + 2];
                        
                        state <= SEND_MSI;
                    end else begin
                        state <= IDLE;
                    end
                end
                
                SEND_MSI: begin
                    msi_req <= 1'b1;
                    state <= WAIT_ACK;
                end
                
                WAIT_ACK: begin
                    if (msi_ack_in) begin
                        msi_req <= 1'b0;
                        
                        // Clear pending flag for this vector
                        vector_pending[selected_vector] <= 1'b0;
                        
                        // Acknowledge the interrupt
                        int_ack[selected_vector] <= 1'b1;
                        
                        // Update statistics
                        int_count <= int_count + 1'b1;
                        
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
