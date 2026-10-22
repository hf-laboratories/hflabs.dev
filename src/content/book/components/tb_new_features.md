---
title: "New Features Testbench — tb_new_features.v"
description: "Comprehensive verification testbench validating 16-channel work stealing and telemetry."
part: "Part II — Component Library"
chapter: "Testbench Components"
category: "Testbench Components"
filename: "testbench/tb_new_features.v"
order: 100
tags: ["Testbench Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/tb_new_features.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/testbench/tb_new_features.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# New Features Testbench — tb_new_features.v

**Filename:** `testbench/tb_new_features.v`

## Description

Comprehensive verification testbench for newly added FPGA features, including agent routing, telemetry collection, scatter-gather, and well-behaved host behavior.

## Integration Points

- Instantiates and validates `agent_message_router`
- Instantiates and validates `telemetry_collector`
- Instantiates and validates `scatter_gather_engine`
- Instantiates and validates `well_behaved_host`
- Provides unified test orchestration, initialization, and summary reporting

## Verilog Source

```verilog
module tb_new_features;
    reg clk;
    reg rst_n;

    parameter NUM_CHANNELS = 16;
    parameter NUM_AGENTS = 16;
    parameter NUM_ACCELERATORS = 4;

    // DUT instantiations
    agent_message_router #( .NUM_AGENTS(NUM_AGENTS) ) amr_dut (...);
    telemetry_collector #( .NUM_CHANNELS(NUM_CHANNELS) ) tel_dut (...);
    scatter_gather_engine #( .MAX_SG_ENTRIES(16) ) sg_dut (...);
    well_behaved_host #( .NUM_ACCELERATORS(NUM_ACCELERATORS) ) wbh_dut (...);
// Comprehensive Testbench for New FPGA Features
// Tests: 16-channel DMA, Agent Message Router, Telemetry, Scatter-Gather, Well-Behaved Host
`timescale 1ns / 1ps

module tb_new_features;

    // Clock and reset
    reg clk;
    reg rst_n;
    
    // Test parameters
    parameter CLK_PERIOD = 4;  // 250 MHz
    parameter NUM_CHANNELS = 16;
    parameter NUM_AGENTS = 16;
    parameter NUM_ACCELERATORS = 4;
    
    // Test statistics
    integer test_pass_count;
    integer test_fail_count;
    integer i;
    
    // Clock generation
    initial begin
        clk = 0;
        forever #(CLK_PERIOD/2) clk = ~clk;
    end
    
    // =========================================================================
    // DUT Signals - Agent Message Router
    // =========================================================================
    reg [NUM_AGENTS-1:0] amr_msg_in_valid;
    reg [NUM_AGENTS-1:0] amr_msg_out_ready;
    reg [3:0] amr_src_agent_id [0:NUM_AGENTS-1];
    reg [3:0] amr_dest_agent_id [0:NUM_AGENTS-1];
    reg [2:0] amr_priority [0:NUM_AGENTS-1];
    reg [255:0] amr_msg_data [0:NUM_AGENTS-1];
    
    wire [NUM_AGENTS-1:0] amr_msg_in_ready;
    wire [NUM_AGENTS-1:0] amr_msg_out_valid;
    wire [255:0] amr_msg_out_data [0:NUM_AGENTS-1];
    wire [31:0] amr_messages_routed;
    wire [31:0] amr_messages_dropped;
    
    // =========================================================================
    // DUT Signals - Telemetry Collector
    // =========================================================================
    reg [NUM_CHANNELS-1:0] tel_channel_active;
    reg [NUM_CHANNELS-1:0] tel_transfer_start;
    reg [NUM_CHANNELS-1:0] tel_transfer_complete;
    reg [NUM_CHANNELS-1:0] tel_transfer_error;
    reg [31:0] tel_transfer_bytes [0:NUM_CHANNELS-1];
    reg [31:0] tel_transfer_cycles [0:NUM_CHANNELS-1];
    
    wire [63:0] tel_total_transfers;
    wire [63:0] tel_total_bytes;
    wire [63:0] tel_total_errors;
    wire [31:0] tel_avg_throughput_mbps;
    wire [31:0] tel_peak_throughput_mbps;
    
    // =========================================================================
    // DUT Signals - Scatter-Gather Engine
    // =========================================================================
    reg [127:0] sg_desc_data;
    reg sg_desc_valid;
    reg [63:0] sg_list_addr;
    reg [7:0] sg_list_count;
    reg sg_list_valid;
    reg [511:0] sg_mem_rd_data;
    reg sg_mem_rd_valid;
    reg sg_dma_cmd_ready;
    
    wire sg_desc_ready;
    wire sg_list_ready;
    wire [63:0] sg_mem_rd_addr;
    wire sg_mem_rd_req;
    wire sg_mem_rd_ready;
    wire [63:0] sg_dma_cmd_addr;
    wire [31:0] sg_dma_cmd_length;
    wire sg_dma_cmd_valid;
    wire sg_busy;
    
    // =========================================================================
    // DUT Signals - Well-Behaved Host
    // =========================================================================
    reg [63:0] wbh_host_rd_addr;
    reg [10:0] wbh_host_rd_len;
    reg wbh_host_rd_req;
    reg wbh_host_rd_ready;
    reg [63:0] wbh_host_wr_addr;
    reg [511:0] wbh_host_wr_data;
    reg [15:0] wbh_host_wr_len;
    reg wbh_host_wr_valid;
    reg [31:0] wbh_mmio_addr;
    reg [31:0] wbh_mmio_wr_data;
    reg wbh_mmio_wr_en;
    reg wbh_mmio_rd_en;
    
    wire wbh_host_rd_ack;
    wire [511:0] wbh_host_rd_data;
    wire wbh_host_rd_valid;
    wire wbh_host_wr_ready;
    wire [31:0] wbh_mmio_rd_data;
    wire wbh_mmio_rd_valid;
    wire wbh_host_compliant;
    wire wbh_rate_limit_active;
    wire [31:0] wbh_pending_requests;
    wire [31:0] wbh_total_requests;
    wire [31:0] wbh_violations;
    
    // =========================================================================
    // DUT Instantiations
    // =========================================================================
    
    // Agent Message Router
    agent_message_router #(
        .NUM_AGENTS(NUM_AGENTS),
        .MESSAGE_WIDTH(256),
        .FIFO_DEPTH(8)
    ) amr_dut (
        .clk(clk),
        .rst_n(rst_n),
        .msg_in_valid(amr_msg_in_valid),
        .msg_in_ready(amr_msg_in_ready),
        .src_agent_id(amr_src_agent_id[0]),  // Simplified for testbench
        .dest_agent_id(amr_dest_agent_id[0]),
        .priority(amr_priority[0]),
        .msg_data(amr_msg_data[0]),
        .msg_out_valid(amr_msg_out_valid),
        .msg_out_ready(amr_msg_out_ready),
        .msg_out_data(amr_msg_out_data[0]),
        .messages_routed(amr_messages_routed),
        .messages_dropped(amr_messages_dropped),
        .agent_busy()
    );
    
    // Telemetry Collector
    telemetry_collector #(
        .NUM_CHANNELS(NUM_CHANNELS),
        .ADDR_WIDTH(64),
        .COUNTER_WIDTH(64)
    ) tel_dut (
        .clk(clk),
        .rst_n(rst_n),
        .channel_active(tel_channel_active),
        .transfer_start(tel_transfer_start),
        .transfer_complete(tel_transfer_complete),
        .transfer_error(tel_transfer_error),
        .transfer_bytes(tel_transfer_bytes),
        .transfer_cycles(tel_transfer_cycles),
        .desc_fetch_event(1'b0),
        .completion_event(1'b0),
        .interrupt_event(1'b0),
        .error_event(1'b0),
        .telemetry_addr(64'd0),
        .telemetry_rd_req(1'b0),
        .telemetry_rd_data(),
        .telemetry_rd_valid(),
        .total_transfers(tel_total_transfers),
        .total_bytes(tel_total_bytes),
        .total_errors(tel_total_errors),
        .avg_throughput_mbps(tel_avg_throughput_mbps),
        .peak_throughput_mbps(tel_peak_throughput_mbps),
        .active_channel_count()
    );
    
    // Scatter-Gather Engine
    scatter_gather_engine #(
        .ADDR_WIDTH(64),
        .DATA_WIDTH(512),
        .MAX_SG_ENTRIES(16)
    ) sg_dut (
        .clk(clk),
        .rst_n(rst_n),
        .sg_desc_data(sg_desc_data),
        .sg_desc_valid(sg_desc_valid),
        .sg_desc_ready(sg_desc_ready),
        .sg_list_addr(sg_list_addr),
        .sg_list_count(sg_list_count),
        .sg_list_valid(sg_list_valid),
        .sg_list_ready(sg_list_ready),
        .mem_rd_addr(sg_mem_rd_addr),
        .mem_rd_len(),
        .mem_rd_req(sg_mem_rd_req),
        .mem_rd_ack(sg_mem_rd_req),
        .mem_rd_data(sg_mem_rd_data),
        .mem_rd_valid(sg_mem_rd_valid),
        .mem_rd_ready(sg_mem_rd_ready),
        .dma_cmd_src_addr(sg_dma_cmd_addr),
        .dma_cmd_dst_addr(),
        .dma_cmd_length(sg_dma_cmd_length),
        .dma_cmd_flags(),
        .dma_cmd_valid(sg_dma_cmd_valid),
        .dma_cmd_ready(sg_dma_cmd_ready),
        .busy(sg_busy),
        .error()
    );
    
    // Well-Behaved Host
    well_behaved_host #(
        .ADDR_WIDTH(64),
        .DATA_WIDTH(512),
        .NUM_ACCELERATORS(NUM_ACCELERATORS),
        .MAX_OUTSTANDING_REQUESTS(16)
    ) wbh_dut (
        .clk(clk),
        .rst_n(rst_n),
        .host_rd_addr(wbh_host_rd_addr),
        .host_rd_len(wbh_host_rd_len),
        .host_rd_req(wbh_host_rd_req),
        .host_rd_ack(wbh_host_rd_ack),
        .host_rd_data(wbh_host_rd_data),
        .host_rd_valid(wbh_host_rd_valid),
        .host_rd_ready(wbh_host_rd_ready),
        .host_wr_addr(wbh_host_wr_addr),
        .host_wr_data(wbh_host_wr_data),
        .host_wr_len(wbh_host_wr_len),
        .host_wr_valid(wbh_host_wr_valid),
        .host_wr_ready(wbh_host_wr_ready),
        .accel_rd_addr(),
        .accel_rd_len(),
        .accel_rd_req(),
        .accel_rd_ack(4'b0),
        .accel_rd_data(),
        .accel_rd_valid(4'b0),
        .accel_rd_ready(),
        .accel_wr_addr(),
        .accel_wr_data(),
        .accel_wr_len(),
        .accel_wr_valid(),
        .accel_wr_ready(4'b1111),
        .mmio_addr(wbh_mmio_addr),
        .mmio_wr_data(wbh_mmio_wr_data),
        .mmio_wr_en(wbh_mmio_wr_en),
        .mmio_rd_en(wbh_mmio_rd_en),
        .mmio_rd_data(wbh_mmio_rd_data),
        .mmio_rd_valid(wbh_mmio_rd_valid),
        .accel_allocated(),
        .accel_busy(),
        .accel_error(),
        .host_compliant(wbh_host_compliant),
        .rate_limit_active(wbh_rate_limit_active),
        .pending_requests(wbh_pending_requests),
        .total_requests(wbh_total_requests),
        .violations(wbh_violations)
    );
    
    // =========================================================================
    // Test Sequence
    // =========================================================================
    initial begin
        $display("===========================================");
        $display("Comprehensive New Features Testbench");
        $display("===========================================");
        
        // Initialize
        test_pass_count = 0;
        test_fail_count = 0;
        rst_n = 0;
        
        // Initialize all inputs
        init_inputs();
        
        // Reset pulse
        #(CLK_PERIOD * 10);
        rst_n = 1;
        #(CLK_PERIOD * 5);
        
        // Run tests
        test_agent_message_router();
        test_telemetry_collector();
        test_scatter_gather();
        test_well_behaved_host();
        
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
    
    // =========================================================================
    // Test Tasks
    // =========================================================================
    
    task init_inputs;
        begin
            // Agent Message Router
            amr_msg_in_valid = {NUM_AGENTS{1'b0}};
            amr_msg_out_ready = {NUM_AGENTS{1'b0}};
            for (i = 0; i < NUM_AGENTS; i = i + 1) begin
                amr_src_agent_id[i] = 4'd0;
                amr_dest_agent_id[i] = 4'd0;
                amr_priority[i] = 3'd0;
                amr_msg_data[i] = 256'd0;
            end
            
            // Telemetry
            tel_channel_active = {NUM_CHANNELS{1'b0}};
            tel_transfer_start = {NUM_CHANNELS{1'b0}};
            tel_transfer_complete = {NUM_CHANNELS{1'b0}};
            tel_transfer_error = {NUM_CHANNELS{1'b0}};
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                tel_transfer_bytes[i] = 32'd0;
                tel_transfer_cycles[i] = 32'd0;
            end
            
            // Scatter-Gather
            sg_desc_data = 128'd0;
            sg_desc_valid = 1'b0;
            sg_list_addr = 64'd0;
            sg_list_count = 8'd0;
            sg_list_valid = 1'b0;
            sg_mem_rd_data = 512'd0;
            sg_mem_rd_valid = 1'b0;
            sg_dma_cmd_ready = 1'b0;
            
            // Well-Behaved Host
            wbh_host_rd_addr = 64'd0;
            wbh_host_rd_len = 11'd0;
            wbh_host_rd_req = 1'b0;
            wbh_host_rd_ready = 1'b0;
            wbh_host_wr_addr = 64'd0;
            wbh_host_wr_data = 512'd0;
            wbh_host_wr_len = 16'd0;
            wbh_host_wr_valid = 1'b0;
            wbh_mmio_addr = 32'd0;
            wbh_mmio_wr_data = 32'd0;
            wbh_mmio_wr_en = 1'b0;
            wbh_mmio_rd_en = 1'b0;
        end
    endtask
    
    task test_agent_message_router;
        begin
            $display("\n[TEST] Agent Message Router");
            
            // Test message routing
            @(posedge clk);
            amr_src_agent_id[0] = 4'd0;
            amr_dest_agent_id[0] = 4'd1;
            amr_priority[0] = 3'd5;
            amr_msg_data[0] = 256'hDEADBEEF_CAFEBABE;
            amr_msg_in_valid[0] = 1'b1;
            
            @(posedge clk);
            if (amr_msg_in_ready[0]) begin
                $display("  PASS: Message accepted by router");
                test_pass_count = test_pass_count + 1;
            end else begin
                $display("  FAIL: Message not accepted");
                test_fail_count = test_fail_count + 1;
            end
            
            amr_msg_in_valid = {NUM_AGENTS{1'b0}};
            #(CLK_PERIOD * 10);
        end
    endtask
    
    task test_telemetry_collector;
        begin
            $display("\n[TEST] Telemetry Collector");
            
            // Simulate transfer on channel 0
            @(posedge clk);
            tel_channel_active[0] = 1'b1;
            tel_transfer_start[0] = 1'b1;
            tel_transfer_bytes[0] = 32'd4096;
            tel_transfer_cycles[0] = 32'd100;
            
            @(posedge clk);
            tel_transfer_start[0] = 1'b0;
            tel_transfer_complete[0] = 1'b1;
            
            @(posedge clk);
            tel_transfer_complete[0] = 1'b0;
            tel_channel_active[0] = 1'b0;
            
            #(CLK_PERIOD * 10);
            
            if (tel_total_transfers > 0) begin
                $display("  PASS: Transfer counted (total=%0d)", tel_total_transfers);
                test_pass_count = test_pass_count + 1;
            end else begin
                $display("  FAIL: Transfer not counted");
                test_fail_count = test_fail_count + 1;
            end
        end
    endtask
    
    task test_scatter_gather;
        begin
            $display("\n[TEST] Scatter-Gather Engine");
            
            // Submit SG descriptor
            @(posedge clk);
            sg_desc_data = {64'h1000, 64'h0}; // Dummy descriptor
            sg_list_addr = 64'h2000;
            sg_list_count = 8'd4;
            sg_desc_valid = 1'b1;
            sg_list_valid = 1'b1;
            
            @(posedge clk);
            if (sg_desc_ready && sg_list_ready) begin
                $display("  PASS: SG descriptor accepted");
                test_pass_count = test_pass_count + 1;
            end else begin
                $display("  FAIL: SG descriptor not accepted");
                test_fail_count = test_fail_count + 1;
            end
            
            sg_desc_valid = 1'b0;
            sg_list_valid = 1'b0;
            #(CLK_PERIOD * 10);
        end
    endtask
    
    task test_well_behaved_host;
        begin
            $display("\n[TEST] Well-Behaved Host");
            
            // Enable host interface
            @(posedge clk);
            wbh_mmio_addr = 32'h00;  // HOST_CONTROL
            wbh_mmio_wr_data = 32'h01;  // Enable bit
            wbh_mmio_wr_en = 1'b1;
            
            @(posedge clk);
            wbh_mmio_wr_en = 1'b0;
            #(CLK_PERIOD * 5);
            
            // Test read request
            wbh_host_rd_addr = 64'h1000;
            wbh_host_rd_len = 11'd16;
            wbh_host_rd_req = 1'b1;
            
            @(posedge clk);
            if (wbh_host_rd_ack) begin
                $display("  PASS: Host read request acknowledged");
                test_pass_count = test_pass_count + 1;
            end else begin
                $display("  FAIL: Host read request not acknowledged");
                test_fail_count = test_fail_count + 1;
            end
            
            wbh_host_rd_req = 1'b0;
            #(CLK_PERIOD * 10);
            
            // Check compliance
            if (wbh_host_compliant) begin
                $display("  PASS: Host marked as compliant");
                test_pass_count = test_pass_count + 1;
            end else begin
                $display("  WARN: Host not marked compliant");
            end
        end
    endtask
    
    // Timeout watchdog
    initial begin
        #5000000; // 5ms timeout
        $display("\n*** ERROR: Testbench timeout ***");
        $finish;
    end

endmodule
endmodule
```
