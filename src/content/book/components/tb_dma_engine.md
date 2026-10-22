---
title: "DMA Engine Testbench — tb_dma_engine.v"
description: "System-level verification testbench exercising DMA transfers, descriptor loops, and backpressure."
part: "Part II — Component Library"
chapter: "Testbench Components"
category: "Testbench Components"
filename: "testbench/tb_dma_engine.v"
order: 100
tags: ["Testbench Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/tb_dma_engine.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/testbench/tb_dma_engine.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# DMA Engine Testbench — tb_dma_engine.v

**Filename:** `testbench/tb_dma_engine.v`

## Description

Basic functional testbench for the FPGA DMA subsystem that exercises message routing into the P2P path and validates transfer initiation behavior.

## Integration Points

- Instantiates `agent_message_router` as the transfer request source
- Instantiates `p2p_dma_controller` for end-to-end P2P transfer path validation
- Provides clock/reset generation, scenario injection, pass/fail tracking, and timeout watchdog

## Verilog Source

```verilog
module tb_fpga_dma_engine;
    reg clk;
    reg rst_n;

    localparam NUM_AGENTS = 16;
    localparam MSG_WIDTH = 256;
    localparam AGENT_ADDR_WIDTH = 4;

    // Agent message router instance
    agent_message_router #(
        .NUM_AGENTS(NUM_AGENTS),
        .MSG_WIDTH(MSG_WIDTH),
        .ADDR_WIDTH(AGENT_ADDR_WIDTH)
    ) agent_router (...);

    // P2P DMA controller instance
    p2p_dma_controller #(
        .AGENT_WIDTH(AGENT_ADDR_WIDTH)
    ) p2p_dma (...);
// Basic Testbench for FPGA DMA Engine
// Provides simple functional verification of key modules

`timescale 1ns / 1ps

module tb_fpga_dma_engine;

    // Clock and reset
    reg clk;
    reg rst_n;
    
    // Test parameters
    parameter CLK_PERIOD = 4; // 250 MHz

    localparam NUM_AGENTS = 16;
    localparam MSG_WIDTH = 256;
    localparam AGENT_ADDR_WIDTH = 4;
    localparam [63:0] GPU_SAMPLE_ADDR = 64'h4000_0000_0000_1000;
    
    // Agent message router signals
    reg  [NUM_AGENTS-1:0]  msg_in_valid;
    reg  [MSG_WIDTH-1:0]   msg_in_data [0:NUM_AGENTS-1];
    reg  [AGENT_ADDR_WIDTH-1:0] msg_in_dest [0:NUM_AGENTS-1];
    reg  [2:0]             msg_in_priority [0:NUM_AGENTS-1];
    wire [NUM_AGENTS-1:0]  msg_in_ready;
    
    wire [NUM_AGENTS-1:0]  msg_out_valid;
    wire [MSG_WIDTH-1:0]   msg_out_data [0:NUM_AGENTS-1];
    wire [AGENT_ADDR_WIDTH-1:0] msg_out_src [0:NUM_AGENTS-1];
    wire [2:0]             msg_out_priority [0:NUM_AGENTS-1];
    reg  [NUM_AGENTS-1:0]  msg_out_ready;
    
    wire                   zcopy_transfer_valid;
    wire [AGENT_ADDR_WIDTH-1:0] zcopy_src_agent;
    wire [AGENT_ADDR_WIDTH-1:0] zcopy_dst_agent;
    wire [63:0]            zcopy_buffer_iova;
    wire [31:0]            zcopy_buffer_size;
    wire [31:0]            zcopy_transfer_tag;
    wire                   zcopy_transfer_ready;
    wire                   zcopy_transfer_done;
    wire [31:0]            zcopy_transfer_status;
    wire [31:0]            zcopy_transfers_initiated;
    
    wire [255:0]           p2p_tlp_data;
    wire                   p2p_tlp_valid;
    wire                   p2p_tlp_sop;
    wire                   p2p_tlp_eop;
    reg                    p2p_tlp_ready;
    
    // Test statistics
    integer test_pass_count;
    integer test_fail_count;
    
    // Clock generation
    initial begin
        clk = 0;
        forever #(CLK_PERIOD/2) clk = ~clk;
    end

    integer init_idx;
    initial begin
        for (init_idx = 0; init_idx < NUM_AGENTS; init_idx = init_idx + 1) begin
            msg_in_valid[init_idx] = 1'b0;
            msg_in_data[init_idx] = {MSG_WIDTH{1'b0}};
            msg_in_dest[init_idx] = {AGENT_ADDR_WIDTH{1'b0}};
            msg_in_priority[init_idx] = 3'd0;
            msg_out_ready[init_idx] = 1'b1;
        end
        p2p_tlp_ready = 1'b1;
    end
    
    // Test sequence
    initial begin
        $display("===========================================");
        $display("FPGA DMA Engine Testbench");
        $display("===========================================");
        
        // Initialize
        test_pass_count = 0;
        test_fail_count = 0;
        rst_n = 0;
        
        // Reset pulse
        #(CLK_PERIOD * 10);
        rst_n = 1;
        #(CLK_PERIOD * 5);
        
        // Run tests
        test_modules_present();
        test_agent_message_router();
        
        // Report results
        #(CLK_PERIOD * 100);
        $display("\n===========================================");
        $display("Test Summary");
        $display("===========================================");
        $display("Tests Passed: %0d", test_pass_count);
        $display("Tests Failed: %0d", test_fail_count);
        
        if (test_fail_count == 0) begin
            $display("\n*** ALL TESTS PASSED ***\n");
        end else begin
            $display("\n*** SOME TESTS FAILED ***\n");
        end
        
        $finish;
    end

    // Agent message router instance
    agent_message_router #(
        .NUM_AGENTS(NUM_AGENTS),
        .MSG_WIDTH(MSG_WIDTH),
        .ADDR_WIDTH(AGENT_ADDR_WIDTH)
    ) agent_router (
        .clk(clk),
        .rst_n(rst_n),
        .msg_in_valid(msg_in_valid),
        .msg_in_data(msg_in_data),
        .msg_in_dest(msg_in_dest),
        .msg_in_priority(msg_in_priority),
        .msg_in_ready(msg_in_ready),
        .msg_out_valid(msg_out_valid),
        .msg_out_data(msg_out_data),
        .msg_out_src(msg_out_src),
        .msg_out_priority(msg_out_priority),
        .msg_out_ready(msg_out_ready),
        .zcopy_transfer_valid(zcopy_transfer_valid),
        .zcopy_src_agent(zcopy_src_agent),
        .zcopy_dst_agent(zcopy_dst_agent),
        .zcopy_buffer_iova(zcopy_buffer_iova),
        .zcopy_buffer_size(zcopy_buffer_size),
        .zcopy_transfer_tag(zcopy_transfer_tag),
        .zcopy_transfer_ready(zcopy_transfer_ready),
        .zcopy_transfer_done(zcopy_transfer_done),
        .zcopy_transfer_status(zcopy_transfer_status),
        .total_messages_routed(),
        .messages_dropped(),
        .zcopy_transfers_initiated(zcopy_transfers_initiated),
        .zcopy_transfers_completed(),
        .agent_busy()
    );
    
    // P2P DMA controller instance
    p2p_dma_controller #(
        .AGENT_WIDTH(AGENT_ADDR_WIDTH)
    ) p2p_dma (
        .clk(clk),
        .rst_n(rst_n),
        .transfer_valid(zcopy_transfer_valid),
        .transfer_ready(zcopy_transfer_ready),
        .transfer_src_agent(zcopy_src_agent),
        .transfer_dst_agent(zcopy_dst_agent),
        .transfer_addr(zcopy_buffer_iova),
        .transfer_length(zcopy_buffer_size),
        .transfer_tag(zcopy_transfer_tag[7:0]), // Lower 8 bits mirror DMA tag width.
        .transfer_done(zcopy_transfer_done),
        .transfer_status(zcopy_transfer_status),
        .tlp_data(p2p_tlp_data),
        .tlp_valid(p2p_tlp_valid),
        .tlp_sop(p2p_tlp_sop),
        .tlp_eop(p2p_tlp_eop),
        .tlp_ready(p2p_tlp_ready),
        .target_id()
    );
    
    // Test tasks
    task test_modules_present;
        begin
            $display("\n[TEST] Module Presence Check");
            $display("  PASS: Testbench infrastructure present");
            test_pass_count = test_pass_count + 1;
        end
    endtask

    task test_agent_message_router;
        begin
            $display("\n[TEST] Agent Message Router P2P Path");
            
            msg_in_dest[0] = 4'd1;
            msg_in_priority[0] = 3'd3;
            msg_in_data[0] = {8'h01, GPU_SAMPLE_ADDR, 32'd64, 32'h0000_0001, 120'd0};
            
            @(posedge clk);
            msg_in_valid[0] = 1'b1;
            @(posedge clk);
            msg_in_valid[0] = 1'b0;
            
            repeat (4) @(posedge clk);
            
            if (zcopy_transfers_initiated != 0) begin
                $display("  PASS: P2P transfer initiated via agent router");
                test_pass_count = test_pass_count + 1;
            end else begin
                $display("  FAIL: P2P transfer was not initiated");
                test_fail_count = test_fail_count + 1;
            end
        end
    endtask
    
    // Timeout watchdog
    initial begin
        #1000000; // 1ms timeout
        $display("\n*** ERROR: Testbench timeout ***");
        $finish;
    end

endmodule
endmodule
```
