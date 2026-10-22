---
title: "IOMMU Page Table Walker — iommu_page_table_walker.v"
description: "Multi-level virtual-to-physical address translation walker with integrated TLB cache."
part: "Part II — Component Library"
chapter: "IOMMU Components"
category: "IOMMU Components"
filename: "iommu/iommu_page_table_walker.v"
order: 100
tags: ["IOMMU Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/iommu_page_table_walker.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/iommu/iommu_page_table_walker.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# IOMMU Page Table Walker — iommu_page_table_walker.v

**Filename:** `iommu/iommu_page_table_walker.v`

## Description

Implements a hardware page-table walker for IOMMU address translation. It accepts translation requests, walks page-table entries via memory reads, and returns translated physical addresses with fault signaling.

## Integration Points

- Sits on the DMA/PCIe address translation path before memory access
- Consumes virtual addresses and context identifiers from request pipeline
- Issues page-table memory reads and returns translation/fault results to caller

## Verilog Source

```verilog
module iommu_page_table_walker #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 64,
    parameter VPN_WIDTH  = 48,
    parameter PPN_WIDTH  = 52
)(
    input  wire                     clk,
    input  wire                     rst_n,
    // Translation request
    input  wire [ADDR_WIDTH-1:0]    req_vaddr,
    input  wire                     req_valid,
    output reg                      req_ready,
    // Translation response
    output reg  [ADDR_WIDTH-1:0]    resp_paddr,
    output reg                      resp_valid,
    output reg                      resp_fault,
    input  wire                     resp_ready,
    // Page-table memory interface
    output reg  [ADDR_WIDTH-1:0]    pt_rd_addr,
    output reg                      pt_rd_req,
    input  wire                     pt_rd_ack,
    input  wire [DATA_WIDTH-1:0]    pt_rd_data,
    input  wire                     pt_rd_valid
);
// IOMMU Page Table Walker
// Implements multi-level page table walking for virtual-to-physical address translation
// Supports 4-level page tables with configurable page sizes

module iommu_page_table_walker #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 512,
    parameter NUM_LEVELS = 4,
    parameter PAGE_SIZE = 4096,  // 4KB pages
    parameter TLB_ENTRIES = 64
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // Translation request interface
    input  wire [ADDR_WIDTH-1:0]    virt_addr,
    input  wire [15:0]              device_id,
    input  wire                     trans_req,
    output reg                      trans_ack,
    output reg  [ADDR_WIDTH-1:0]    phys_addr,
    output reg                      trans_valid,
    output reg                      trans_fault,
    output reg  [3:0]               fault_reason,
    input  wire                     trans_ready,
    
    // Page table base register
    input  wire [ADDR_WIDTH-1:0]    pt_base_addr,
    input  wire                     pt_enable,
    
    // Memory interface for page table reads
    output reg  [ADDR_WIDTH-1:0]    mem_rd_addr,
    output reg  [10:0]              mem_rd_len,
    output reg                      mem_rd_req,
    input  wire                     mem_rd_ack,
    input  wire [DATA_WIDTH-1:0]    mem_rd_data,
    input  wire                     mem_rd_valid,
    output wire                     mem_rd_ready,
    
    // TLB interface
    output reg                      tlb_lookup_req,
    output reg  [ADDR_WIDTH-1:0]    tlb_lookup_vaddr,
    input  wire                     tlb_hit,
    input  wire [ADDR_WIDTH-1:0]    tlb_phys_addr,
    input  wire [7:0]               tlb_permissions,
    
    output reg                      tlb_update_req,
    output reg  [ADDR_WIDTH-1:0]    tlb_update_vaddr,
    output reg  [ADDR_WIDTH-1:0]    tlb_update_paddr,
    output reg  [7:0]               tlb_update_perms,
    
    // Statistics
    output reg  [31:0]              translations_completed,
    output reg  [31:0]              tlb_hits,
    output reg  [31:0]              tlb_misses,
    output reg  [31:0]              page_faults,
    output reg  [31:0]              permission_faults
);

    // Page table entry format (64 bits)
    // [63]     - Valid
    // [62:52]  - Reserved
    // [51:12]  - Physical page number
    // [11:9]   - Reserved
    // [8:0]    - Permissions (Read, Write, Execute, User, etc.)
    
    localparam PTE_VALID_BIT    = 63;
    localparam PTE_READABLE     = 0;
    localparam PTE_WRITABLE     = 1;
    localparam PTE_EXECUTABLE   = 2;
    localparam PTE_USER         = 3;
    
    // Fault reasons
    localparam FAULT_NONE           = 4'h0;
    localparam FAULT_PAGE_NOT_PRESENT = 4'h1;
    localparam FAULT_PROTECTION     = 4'h2;
    localparam FAULT_RESERVED       = 4'h3;
    localparam FAULT_TABLE_ERROR    = 4'h4;
    
    // State machine
    localparam IDLE             = 4'd0;
    localparam TLB_LOOKUP       = 4'd1;
    localparam LEVEL0_FETCH     = 4'd2;
    localparam LEVEL1_FETCH     = 4'd3;
    localparam LEVEL2_FETCH     = 4'd4;
    localparam LEVEL3_FETCH     = 4'd5;
    localparam WAIT_MEM         = 4'd6;
    localparam CHECK_PTE        = 4'd7;
    localparam TLB_UPDATE       = 4'd8;
    localparam COMPLETE         = 4'd9;
    localparam FAULT            = 4'd10;
    
    reg [3:0] state;
    reg [3:0] next_state;
    reg [2:0] current_level;
    reg [ADDR_WIDTH-1:0] virt_addr_reg;
    reg [15:0] device_id_reg;
    reg [ADDR_WIDTH-1:0] current_table_addr;
    reg [63:0] pte_buffer [0:NUM_LEVELS-1];
    reg [7:0] final_permissions;
    
    assign mem_rd_ready = 1'b1;
    
    // Extract page table indices from virtual address
    // For 4-level paging with 4KB pages:
    // Bits 47:39 - Level 0 index (PML4)
    // Bits 38:30 - Level 1 index (PDPT)
    // Bits 29:21 - Level 2 index (PD)
    // Bits 20:12 - Level 3 index (PT)
    // Bits 11:0  - Page offset
    
    wire [8:0] level0_index = virt_addr_reg[47:39];
    wire [8:0] level1_index = virt_addr_reg[38:30];
    wire [8:0] level2_index = virt_addr_reg[29:21];
    wire [8:0] level3_index = virt_addr_reg[20:12];
    wire [11:0] page_offset = virt_addr_reg[11:0];
    
    // Calculate table entry address
    function [ADDR_WIDTH-1:0] calc_pte_addr;
        input [ADDR_WIDTH-1:0] table_base;
        input [8:0] index;
        begin
            calc_pte_addr = table_base + (index << 3);  // 8 bytes per entry
        end
    endfunction
    
    // Main state machine
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            current_level <= 3'd0;
            virt_addr_reg <= {ADDR_WIDTH{1'b0}};
            device_id_reg <= 16'd0;
            current_table_addr <= {ADDR_WIDTH{1'b0}};
            trans_ack <= 1'b0;
            trans_valid <= 1'b0;
            trans_fault <= 1'b0;
            fault_reason <= FAULT_NONE;
            phys_addr <= {ADDR_WIDTH{1'b0}};
            mem_rd_req <= 1'b0;
            tlb_lookup_req <= 1'b0;
            tlb_update_req <= 1'b0;
            final_permissions <= 8'h00;
            translations_completed <= 32'd0;
            tlb_hits <= 32'd0;
            tlb_misses <= 32'd0;
            page_faults <= 32'd0;
            permission_faults <= 32'd0;
        end else begin
            // Default: clear one-shot signals
            trans_ack <= 1'b0;
            mem_rd_req <= 1'b0;
            tlb_lookup_req <= 1'b0;
            tlb_update_req <= 1'b0;
            
            case (state)
                IDLE: begin
                    trans_valid <= 1'b0;
                    trans_fault <= 1'b0;
                    
                    if (trans_req && pt_enable) begin
                        virt_addr_reg <= virt_addr;
                        device_id_reg <= device_id;
                        current_table_addr <= pt_base_addr;
                        current_level <= 3'd0;
                        trans_ack <= 1'b1;
                        state <= TLB_LOOKUP;
                    end
                end
                
                TLB_LOOKUP: begin
                    tlb_lookup_req <= 1'b1;
                    tlb_lookup_vaddr <= virt_addr_reg;
                    state <= LEVEL0_FETCH;
                end
                
                LEVEL0_FETCH: begin
                    if (tlb_hit) begin
                        // TLB hit - use cached translation
                        phys_addr <= tlb_phys_addr;
                        final_permissions <= tlb_permissions;
                        tlb_hits <= tlb_hits + 1'b1;
                        state <= COMPLETE;
                    end else begin
                        // TLB miss - walk page tables
                        tlb_misses <= tlb_misses + 1'b1;
                        mem_rd_addr <= calc_pte_addr(current_table_addr, level0_index);
                        mem_rd_len <= 11'd2;  // 8 bytes = 2 DWORDs
                        mem_rd_req <= 1'b1;
                        next_state <= LEVEL1_FETCH;
                        state <= WAIT_MEM;
                    end
                end
                
                LEVEL1_FETCH: begin
                    mem_rd_addr <= calc_pte_addr(current_table_addr, level1_index);
                    mem_rd_len <= 11'd2;
                    mem_rd_req <= 1'b1;
                    next_state <= LEVEL2_FETCH;
                    state <= WAIT_MEM;
                end
                
                LEVEL2_FETCH: begin
                    mem_rd_addr <= calc_pte_addr(current_table_addr, level2_index);
                    mem_rd_len <= 11'd2;
                    mem_rd_req <= 1'b1;
                    next_state <= LEVEL3_FETCH;
                    state <= WAIT_MEM;
                end
                
                LEVEL3_FETCH: begin
                    mem_rd_addr <= calc_pte_addr(current_table_addr, level3_index);
                    mem_rd_len <= 11'd2;
                    mem_rd_req <= 1'b1;
                    next_state <= CHECK_PTE;
                    state <= WAIT_MEM;
                end
                
                WAIT_MEM: begin
                    if (mem_rd_valid && mem_rd_ready) begin
                        pte_buffer[current_level] <= mem_rd_data[63:0];
                        state <= CHECK_PTE;
                    end
                end
                
                CHECK_PTE: begin
                    // Check if PTE is valid
                    if (!pte_buffer[current_level][PTE_VALID_BIT]) begin
                        fault_reason <= FAULT_PAGE_NOT_PRESENT;
                        page_faults <= page_faults + 1'b1;
                        state <= FAULT;
                    end else if (current_level == 3) begin
                        // Final level - extract physical address
                        phys_addr <= {pte_buffer[3][51:12], page_offset};
                        final_permissions <= pte_buffer[3][7:0];
                        state <= TLB_UPDATE;
                    end else begin
                        // Move to next level
                        current_table_addr <= {pte_buffer[current_level][51:12], 12'b0};
                        current_level <= current_level + 1'b1;
                        
                        case (current_level)
                            3'd0: state <= LEVEL1_FETCH;
                            3'd1: state <= LEVEL2_FETCH;
                            3'd2: state <= LEVEL3_FETCH;
                            default: state <= FAULT;
                        endcase
                    end
                end
                
                TLB_UPDATE: begin
                    // Update TLB with new mapping
                    tlb_update_req <= 1'b1;
                    tlb_update_vaddr <= virt_addr_reg;
                    tlb_update_paddr <= phys_addr;
                    tlb_update_perms <= final_permissions;
                    state <= COMPLETE;
                end
                
                COMPLETE: begin
                    trans_valid <= 1'b1;
                    trans_fault <= 1'b0;
                    translations_completed <= translations_completed + 1'b1;
                    
                    if (trans_ready) begin
                        state <= IDLE;
                    end
                end
                
                FAULT: begin
                    trans_valid <= 1'b1;
                    trans_fault <= 1'b1;
                    
                    if (trans_ready) begin
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
