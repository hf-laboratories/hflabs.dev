---
title: "Telemetry Collector — telemetry_collector.v"
description: "Observability engine monitoring per-channel and aggregate byte throughput and real-time Mbps."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/telemetry_collector.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/telemetry_collector.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/telemetry_collector.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Telemetry Collector — telemetry_collector.v

**Filename:** `dma_engine/telemetry_collector.v`

## Description

Collects per-channel and global DMA telemetry (transfers, bytes, errors, throughput) and provides readout via telemetry register interface.

## Integration Points

- Consumes runtime transfer/completion/error event signals from DMA channels
- Exposes statistics for diagnostics, ranking, and adaptive control loops

## Verilog Source

```verilog
module telemetry_collector #(
    parameter NUM_CHANNELS = 16,
    parameter ADDR_WIDTH = 64,
    parameter COUNTER_WIDTH = 64
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [NUM_CHANNELS-1:0]      channel_active,
    input  wire [NUM_CHANNELS-1:0]      transfer_start,
    input  wire [NUM_CHANNELS-1:0]      transfer_complete,
    input  wire [NUM_CHANNELS-1:0]      transfer_error,
    input  wire [31:0]                  transfer_bytes [0:NUM_CHANNELS-1],
    input  wire                         telemetry_rd_req,
    output reg  [63:0]                  telemetry_rd_data,
    output reg                          telemetry_rd_valid
);
// Telemetry Collector
// Collects performance metrics and telemetry data from DMA engine
// Supports real-time monitoring and statistics
module telemetry_collector #(
    parameter NUM_CHANNELS = 16,
    parameter ADDR_WIDTH = 64,
    parameter COUNTER_WIDTH = 64
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // DMA channel events
    input  wire [NUM_CHANNELS-1:0]      channel_active,
    input  wire [NUM_CHANNELS-1:0]      transfer_start,
    input  wire [NUM_CHANNELS-1:0]      transfer_complete,
    input  wire [NUM_CHANNELS-1:0]      transfer_error,
    input  wire [31:0]                  transfer_bytes [0:NUM_CHANNELS-1],
    input  wire [31:0]                  transfer_cycles [0:NUM_CHANNELS-1],
    
    // System events
    input  wire                         desc_fetch_event,
    input  wire                         completion_event,
    input  wire                         interrupt_event,
    input  wire                         error_event,
    
    // Memory interface for telemetry readout
    input  wire [ADDR_WIDTH-1:0]        telemetry_addr,
    input  wire                         telemetry_rd_req,
    output reg  [63:0]                  telemetry_rd_data,
    output reg                          telemetry_rd_valid,
    
    // Global statistics outputs
    output reg  [COUNTER_WIDTH-1:0]     total_transfers,
    output reg  [COUNTER_WIDTH-1:0]     total_bytes,
    output reg  [COUNTER_WIDTH-1:0]     total_errors,
    output reg  [31:0]                  avg_throughput_mbps,
    output reg  [31:0]                  peak_throughput_mbps,
    output reg  [15:0]                  active_channel_count
);

    // Per-channel counters
    reg [COUNTER_WIDTH-1:0] channel_transfers [0:NUM_CHANNELS-1];
    reg [COUNTER_WIDTH-1:0] channel_bytes [0:NUM_CHANNELS-1];
    reg [COUNTER_WIDTH-1:0] channel_errors [0:NUM_CHANNELS-1];
    reg [31:0] channel_cycles [0:NUM_CHANNELS-1];
    
    // Global counters
    reg [COUNTER_WIDTH-1:0] total_desc_fetches;
    reg [COUNTER_WIDTH-1:0] total_completions;
    reg [COUNTER_WIDTH-1:0] total_interrupts;
    
    // Throughput measurement
    reg [31:0] byte_counter;
    reg [31:0] cycle_counter;
    reg [31:0] measurement_window;
    
    // Temporary variables for per-channel register access
    reg [31:0] ch_idx_temp;
    reg [31:0] ch_reg_temp;
    
    // Telemetry register map (offset from base address)
    localparam REG_TOTAL_TRANSFERS     = 8'h00;
    localparam REG_TOTAL_BYTES_LO      = 8'h08;
    localparam REG_TOTAL_BYTES_HI      = 8'h10;
    localparam REG_TOTAL_ERRORS        = 8'h18;
    localparam REG_AVG_THROUGHPUT      = 8'h20;
    localparam REG_PEAK_THROUGHPUT     = 8'h28;
    localparam REG_ACTIVE_CHANNELS     = 8'h30;
    localparam REG_DESC_FETCHES        = 8'h38;
    localparam REG_COMPLETIONS         = 8'h40;
    localparam REG_INTERRUPTS          = 8'h48;
    // Per-channel registers start at 0x100
    localparam REG_CHANNEL_BASE        = 10'h100;
    
    integer i;
    
    // Counter updates
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            // Reset all counters
            total_transfers <= {COUNTER_WIDTH{1'b0}};
            total_bytes <= {COUNTER_WIDTH{1'b0}};
            total_errors <= {COUNTER_WIDTH{1'b0}};
            total_desc_fetches <= {COUNTER_WIDTH{1'b0}};
            total_completions <= {COUNTER_WIDTH{1'b0}};
            total_interrupts <= {COUNTER_WIDTH{1'b0}};
            avg_throughput_mbps <= 32'd0;
            peak_throughput_mbps <= 32'd0;
            active_channel_count <= 16'd0;
            byte_counter <= 32'd0;
            cycle_counter <= 32'd0;
            measurement_window <= 32'd250000000; // 1 second at 250 MHz
            
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                channel_transfers[i] <= {COUNTER_WIDTH{1'b0}};
                channel_bytes[i] <= {COUNTER_WIDTH{1'b0}};
                channel_errors[i] <= {COUNTER_WIDTH{1'b0}};
                channel_cycles[i] <= 32'd0;
            end
        end else begin
            // Update per-channel counters
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                if (transfer_start[i]) begin
                    channel_transfers[i] <= channel_transfers[i] + 1;
                    total_transfers <= total_transfers + 1;
                end
                
                if (transfer_complete[i]) begin
                    channel_bytes[i] <= channel_bytes[i] + transfer_bytes[i];
                    total_bytes <= total_bytes + transfer_bytes[i];
                    channel_cycles[i] <= transfer_cycles[i];
                    byte_counter <= byte_counter + transfer_bytes[i];
                end
                
                if (transfer_error[i]) begin
                    channel_errors[i] <= channel_errors[i] + 1;
                    total_errors <= total_errors + 1;
                end
            end
            
            // Update global event counters
            if (desc_fetch_event)
                total_desc_fetches <= total_desc_fetches + 1;
            
            if (completion_event)
                total_completions <= total_completions + 1;
            
            if (interrupt_event)
                total_interrupts <= total_interrupts + 1;
            
            // Count active channels
            active_channel_count <= 16'd0;
            for (i = 0; i < NUM_CHANNELS; i = i + 1) begin
                if (channel_active[i])
                    active_channel_count <= active_channel_count + 1;
            end
            
            // Throughput measurement (rolling window)
            cycle_counter <= cycle_counter + 1;
            
            if (cycle_counter >= measurement_window) begin
                // Calculate throughput in Mbps
                // Throughput = (bytes * 8) / (cycles / freq) / 1e6
                // = (bytes * 8 * freq) / (cycles * 1e6)
                // = (bytes * 8 * 250e6) / (cycles * 1e6)
                // = (bytes * 2000) / cycles
                avg_throughput_mbps <= (byte_counter * 2000) / cycle_counter;
                
                if ((byte_counter * 2000) / cycle_counter > peak_throughput_mbps)
                    peak_throughput_mbps <= (byte_counter * 2000) / cycle_counter;
                
                // Reset measurement window
                byte_counter <= 32'd0;
                cycle_counter <= 32'd0;
            end
        end
    end
    
    // Telemetry readout interface
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            telemetry_rd_data <= 64'd0;
            telemetry_rd_valid <= 1'b0;
        end else begin
            telemetry_rd_valid <= 1'b0;
            
            if (telemetry_rd_req) begin
                telemetry_rd_valid <= 1'b1;
                
                case (telemetry_addr[7:0])
                    REG_TOTAL_TRANSFERS:    telemetry_rd_data <= total_transfers[63:0];
                    REG_TOTAL_BYTES_LO:     telemetry_rd_data <= total_bytes[63:0];
                    REG_TOTAL_BYTES_HI:     telemetry_rd_data <= 64'd0; // Reserved for future 128-bit counters
                    REG_TOTAL_ERRORS:       telemetry_rd_data <= total_errors[63:0];
                    REG_AVG_THROUGHPUT:     telemetry_rd_data <= {{32{1'b0}}, avg_throughput_mbps};
                    REG_PEAK_THROUGHPUT:    telemetry_rd_data <= {{32{1'b0}}, peak_throughput_mbps};
                    REG_ACTIVE_CHANNELS:    telemetry_rd_data <= {{48{1'b0}}, active_channel_count};
                    REG_DESC_FETCHES:       telemetry_rd_data <= total_desc_fetches[63:0];
                    REG_COMPLETIONS:        telemetry_rd_data <= total_completions[63:0];
                    REG_INTERRUPTS:         telemetry_rd_data <= total_interrupts[63:0];
                    default: begin
                        // Per-channel registers
                        if (telemetry_addr[9:0] >= REG_CHANNEL_BASE) begin
                            ch_idx_temp = (telemetry_addr[9:0] - REG_CHANNEL_BASE) / 32;
                            ch_reg_temp = (telemetry_addr[9:0] - REG_CHANNEL_BASE) % 32;
                            
                            if (ch_idx_temp < NUM_CHANNELS) begin
                                case (ch_reg_temp)
                                    0:  telemetry_rd_data <= channel_transfers[ch_idx_temp][63:0];
                                    8:  telemetry_rd_data <= channel_bytes[ch_idx_temp][63:0];
                                    16: telemetry_rd_data <= channel_errors[ch_idx_temp][63:0];
                                    24: telemetry_rd_data <= {{32{1'b0}}, channel_cycles[ch_idx_temp]};
                                    default: telemetry_rd_data <= 64'd0;
                                endcase
                            end else begin
                                telemetry_rd_data <= 64'd0;
                            end
                        end else begin
                            telemetry_rd_data <= 64'd0;
                        end
                    end
                endcase
            end
        end
    end

endmodule
endmodule
```
