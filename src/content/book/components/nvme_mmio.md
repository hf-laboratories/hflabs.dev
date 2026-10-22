---
title: "NVMe MMIO Interface — nvme_mmio.v"
description: "Standard NVMe 1.4 MMIO register block (CAP, VS, CC, CSTS, AQA, ASQ, ACQ, Doorbells)."
part: "Part II — Component Library"
chapter: "NVMe Controller Components"
category: "NVMe Controller Components"
filename: "nvme_iface/nvme_mmio.v"
order: 100
tags: ["NVMe Controller Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/nvme_mmio.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/nvme_iface/nvme_mmio.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# NVMe MMIO Interface — nvme_mmio.v

**Filename:** `nvme_iface/nvme_mmio.v`

## Description

Implements NVMe controller MMIO register handling (CAP/VS/CC/CSTS/AQA/ASQ/ACQ/INTMS/INTMC) and exposes control-plane configuration for admin queues and interrupts.

## Integration Points

- Register access endpoint for host-side NVMe controller programming
- Config source for controller enable/ready state and queue base addresses/sizes
- Interrupt mask and controller capability/status exposure

## Verilog Source

```verilog
module nvme_mmio #(
    parameter DATA_WIDTH = 32,
    parameter ADDR_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    input  wire [ADDR_WIDTH-1:0]    mmio_addr,
    input  wire [DATA_WIDTH-1:0]    mmio_wr_data,
    input  wire                     mmio_wr_en,
    input  wire                     mmio_rd_en,
    output reg  [DATA_WIDTH-1:0]    mmio_rd_data,
    output reg                      mmio_rd_valid,
    output reg                      ctrl_enable,
    output reg                      ctrl_ready,
    output reg  [15:0]              admin_sq_size,
    output reg  [15:0]              admin_cq_size,
    output reg  [63:0]              admin_sq_addr,
    output reg  [63:0]              admin_cq_addr
);
// NVMe MMIO Interface
// Handles NVMe controller MMIO registers and admin queue
module nvme_mmio #(
    parameter DATA_WIDTH = 32,
    parameter ADDR_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // MMIO access interface
    input  wire [ADDR_WIDTH-1:0]    mmio_addr,
    input  wire [DATA_WIDTH-1:0]    mmio_wr_data,
    input  wire                     mmio_wr_en,
    input  wire                     mmio_rd_en,
    output reg  [DATA_WIDTH-1:0]    mmio_rd_data,
    output reg                      mmio_rd_valid,
    
    // Controller state outputs
    output reg                      ctrl_enable,
    output reg                      ctrl_ready,
    output reg  [15:0]              admin_sq_size,
    output reg  [15:0]              admin_cq_size,
    output reg  [63:0]              admin_sq_addr,
    output reg  [63:0]              admin_cq_addr,
    
    // I/O queue configuration
    output reg  [15:0]              num_io_queues,
    
    // Interrupt configuration
    output reg                      int_coalescing_en,
    output reg  [7:0]               int_coalescing_time,
    output reg  [7:0]               int_coalescing_thresh
);

    // NVMe register offsets (aligned to 4KB page)
    localparam REG_CAP_LO       = 16'h0000;  // Controller capabilities [31:0]
    localparam REG_CAP_HI       = 16'h0004;  // Controller capabilities [63:32]
    localparam REG_VS           = 16'h0008;  // Version
    localparam REG_INTMS        = 16'h000C;  // Interrupt mask set
    localparam REG_INTMC        = 16'h0010;  // Interrupt mask clear
    localparam REG_CC           = 16'h0014;  // Controller configuration
    localparam REG_CSTS         = 16'h001C;  // Controller status
    localparam REG_AQA          = 16'h0024;  // Admin queue attributes
    localparam REG_ASQ_LO       = 16'h0028;  // Admin submission queue [31:0]
    localparam REG_ASQ_HI       = 16'h002C;  // Admin submission queue [63:32]
    localparam REG_ACQ_LO       = 16'h0030;  // Admin completion queue [31:0]
    localparam REG_ACQ_HI       = 16'h0034;  // Admin completion queue [63:32]
    
    wire [15:0] reg_offset = mmio_addr[15:0];
    
    // Controller capabilities
    reg [63:0] cap_reg;
    reg [31:0] version_reg;
    reg [31:0] cc_reg;
    reg [31:0] csts_reg;
    reg [31:0] int_mask;
    
    initial begin
        // Set controller capabilities
        cap_reg[15:0]   = 16'd4095;    // Max queue entries (4096)
        cap_reg[16]     = 1'b1;        // Contiguous queues required
        cap_reg[18:17]  = 2'd0;        // Arbitration mechanism: round robin
        cap_reg[23:19]  = 5'd0;        // Timeout (not used)
        cap_reg[27:24]  = 4'd0;        // Doorbell stride (0 = 4 bytes)
        cap_reg[36:32]  = 5'd8;        // Min page size (2^(12+8) = 1MB)
        cap_reg[51:48]  = 4'd8;        // Max page size (2^(12+8) = 1MB)
        cap_reg[63:52]  = 12'd0;       // Reserved
        
        version_reg = 32'h00010400;    // NVMe 1.4.0
    end
    
    // Write handling
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            ctrl_enable <= 1'b0;
            ctrl_ready <= 1'b0;
            admin_sq_size <= 16'd0;
            admin_cq_size <= 16'd0;
            admin_sq_addr <= 64'd0;
            admin_cq_addr <= 64'd0;
            num_io_queues <= 16'd0;
            int_coalescing_en <= 1'b0;
            int_coalescing_time <= 8'd0;
            int_coalescing_thresh <= 8'd0;
            cc_reg <= 32'd0;
            csts_reg <= 32'd0;
            int_mask <= 32'hFFFFFFFF;
        end else if (mmio_wr_en) begin
            case (reg_offset)
                REG_CC: begin
                    cc_reg <= mmio_wr_data;
                    ctrl_enable <= mmio_wr_data[0];
                    
                    // Set ready after enable
                    if (mmio_wr_data[0]) begin
                        ctrl_ready <= 1'b1;
                        csts_reg[0] <= 1'b1;  // RDY bit
                    end else begin
                        ctrl_ready <= 1'b0;
                        csts_reg[0] <= 1'b0;
                    end
                end
                
                REG_AQA: begin
                    admin_sq_size <= mmio_wr_data[15:0] + 1'b1;
                    admin_cq_size <= mmio_wr_data[31:16] + 1'b1;
                end
                
                REG_ASQ_LO: begin
                    admin_sq_addr[31:0] <= mmio_wr_data;
                end
                
                REG_ASQ_HI: begin
                    admin_sq_addr[63:32] <= mmio_wr_data;
                end
                
                REG_ACQ_LO: begin
                    admin_cq_addr[31:0] <= mmio_wr_data;
                end
                
                REG_ACQ_HI: begin
                    admin_cq_addr[63:32] <= mmio_wr_data;
                end
                
                REG_INTMS: begin
                    int_mask <= int_mask | mmio_wr_data;
                end
                
                REG_INTMC: begin
                    int_mask <= int_mask & ~mmio_wr_data;
                end
                
                default: begin
                    // Ignore writes to read-only or undefined registers
                end
            endcase
        end
    end
    
    // Read handling
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            mmio_rd_data <= 32'd0;
            mmio_rd_valid <= 1'b0;
        end else if (mmio_rd_en) begin
            mmio_rd_valid <= 1'b1;
            
            case (reg_offset)
                REG_CAP_LO: begin
                    mmio_rd_data <= cap_reg[31:0];
                end
                
                REG_CAP_HI: begin
                    mmio_rd_data <= cap_reg[63:32];
                end
                
                REG_VS: begin
                    mmio_rd_data <= version_reg;
                end
                
                REG_INTMS, REG_INTMC: begin
                    mmio_rd_data <= int_mask;
                end
                
                REG_CC: begin
                    mmio_rd_data <= cc_reg;
                end
                
                REG_CSTS: begin
                    mmio_rd_data <= csts_reg;
                end
                
                REG_AQA: begin
                    mmio_rd_data <= {admin_cq_size - 1'b1, admin_sq_size - 1'b1};
                end
                
                REG_ASQ_LO: begin
                    mmio_rd_data <= admin_sq_addr[31:0];
                end
                
                REG_ASQ_HI: begin
                    mmio_rd_data <= admin_sq_addr[63:32];
                end
                
                REG_ACQ_LO: begin
                    mmio_rd_data <= admin_cq_addr[31:0];
                end
                
                REG_ACQ_HI: begin
                    mmio_rd_data <= admin_cq_addr[63:32];
                end
                
                default: begin
                    mmio_rd_data <= 32'd0;
                end
            endcase
        end else begin
            mmio_rd_valid <= 1'b0;
        end
    end

endmodule
endmodule
```
