---
title: "Advanced Error Recovery — advanced_error_recovery.v"
description: "Implements comprehensive error detection, logging, retry state, and policy-driven recovery actions."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/advanced_error_recovery.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/advanced_error_recovery.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/advanced_error_recovery.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Advanced Error Recovery — advanced_error_recovery.v

**Filename:** `util/advanced_error_recovery.v`

## Description

Implements a comprehensive error detection, logging, and recovery engine. It ingests multiple error sources, applies policy-driven recovery actions, tracks retry state, and streams structured error log entries.

- Multi-source error ingestion
- Policy-based recovery actions (`RETRY`, `ROLLBACK`, `DEGRADE`, `RESET`, `SHUTDOWN`)
- Retry counters and fatal/recovered statistics
- Config/MMIO-style register interface
- Timestamped error logging output

## Integration Points

- Centralized reliability block for PCIe, DMA, and control-plane subsystems
- Hooks into platform reset/shutdown orchestration
- Feeds observability/telemetry pipelines through structured log outputs

## Verilog Source

```verilog
// Advanced Error Recovery Module
// Implements sophisticated error detection, logging, and recovery mechanisms
// Supports automatic retry, rollback, and graceful degradation

module advanced_error_recovery #(
    parameter NUM_ERROR_SOURCES = 16,
    parameter LOG_DEPTH = 256,
    parameter RETRY_LIMIT = 3
)(
    input  wire                         clk,
    input  wire                         rst_n,
    // Error inputs from various sources
    input  wire [NUM_ERROR_SOURCES-1:0] error_detected,
    input  wire [3:0]                   error_type [0:NUM_ERROR_SOURCES-1],
    input  wire [31:0]                  error_data [0:NUM_ERROR_SOURCES-1],
    // Recovery control outputs
    output reg  [NUM_ERROR_SOURCES-1:0] recovery_trigger,
    output reg  [2:0]                   recovery_action [0:NUM_ERROR_SOURCES-1],
    output reg                          system_reset_req,
    output reg                          graceful_shutdown_req,
    // Configuration interface
    input  wire [31:0]                  config_addr,
    input  wire [31:0]                  config_wr_data,
    input  wire                         config_wr_en,
    input  wire                         config_rd_en,
    output reg  [31:0]                  config_rd_data,
    output reg                          config_rd_valid,
    // Error log interface
    output reg  [63:0]                  error_log_timestamp,
    output reg  [7:0]                   error_log_source,
    output reg  [3:0]                   error_log_type,
    output reg  [31:0]                  error_log_data,
    output reg                          error_log_valid,
    input  wire                         error_log_ready,
    // Status and statistics
    output reg  [31:0]                  total_errors,
    output reg  [31:0]                  recovered_errors,
    output reg  [31:0]                  unrecoverable_errors,
    output wire [NUM_ERROR_SOURCES-1:0] error_active,
    output reg  [7:0]                   retry_count [0:NUM_ERROR_SOURCES-1]
);
    // Recovery actions
    localparam ACTION_NONE          = 3'd0;
    localparam ACTION_RETRY         = 3'd1;
    localparam ACTION_ROLLBACK      = 3'd2;
    localparam ACTION_ISOLATE       = 3'd3;
    localparam ACTION_DEGRADE       = 3'd4;
    localparam ACTION_RESET         = 3'd5;
    localparam ACTION_SHUTDOWN      = 3'd6;
    // Error types
    localparam ERR_TRANSIENT        = 4'd0;
    localparam ERR_TIMEOUT          = 4'd1;
    localparam ERR_PROTOCOL         = 4'd2;
    localparam ERR_DATA_CORRUPTION  = 4'd3;
    localparam ERR_HARDWARE         = 4'd4;
    localparam ERR_FATAL            = 4'd15;
    // Register map
    localparam REG_CONTROL          = 8'h00;
    localparam REG_STATUS           = 8'h04;
    localparam REG_ERROR_MASK       = 8'h08;
    localparam REG_RECOVERY_POLICY  = 8'h0C;
    localparam REG_RETRY_LIMIT      = 8'h10;
    localparam REG_ERROR_COUNT      = 8'h14;
    localparam REG_RECOVERED_COUNT  = 8'h18;
    localparam REG_FATAL_COUNT      = 8'h1C;
    // Internal state
    reg [NUM_ERROR_SOURCES-1:0] error_active_reg;
    reg [NUM_ERROR_SOURCES-1:0] error_mask;
    reg [2:0] recovery_policy [0:NUM_ERROR_SOURCES-1];
    reg [63:0] cycle_counter;
    reg [7:0] log_write_ptr;
    reg [7:0] log_read_ptr;
    // Error log memory
    reg [63:0] log_timestamp [0:LOG_DEPTH-1];
    reg [7:0]  log_source [0:LOG_DEPTH-1];
    reg [3:0]  log_type [0:LOG_DEPTH-1];
    reg [31:0] log_data [0:LOG_DEPTH-1];
    reg [LOG_DEPTH-1:0] log_valid_bits;
    assign error_active = error_active_reg;
    // Cycle counter for timestamps
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            cycle_counter <= 64'd0;
        else
            cycle_counter <= cycle_counter + 1'b1;
    end
    // Configuration interface
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            config_rd_data <= 32'd0;
            config_rd_valid <= 1'b0;
        end else begin
            config_rd_valid <= config_rd_en;
            if (config_rd_en) begin
                case (config_addr[7:0])
                    REG_CONTROL:        config_rd_data <= 32'd0;
                    REG_STATUS:         config_rd_data <= {{(32-NUM_ERROR_SOURCES){1'b0}}, error_active_reg};
                    REG_ERROR_MASK:     config_rd_data <= {{(32-NUM_ERROR_SOURCES){1'b0}}, error_mask};
                    REG_RETRY_LIMIT:    config_rd_data <= {24'd0, RETRY_LIMIT[7:0]};
                    REG_ERROR_COUNT:    config_rd_data <= total_errors;
                    REG_RECOVERED_COUNT: config_rd_data <= recovered_errors;
                    REG_FATAL_COUNT:    config_rd_data <= unrecoverable_errors;
                    default:            config_rd_data <= 32'd0;
                endcase
            end
        end
    end
    // Configuration writes
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            error_mask <= {NUM_ERROR_SOURCES{1'b0}};
        end else begin
            if (config_wr_en) begin
                case (config_addr[7:0])
                    REG_ERROR_MASK: error_mask <= config_wr_data[NUM_ERROR_SOURCES-1:0];
                endcase
            end
        end
    end
    // Main error recovery logic
    integer i;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            for (i = 0; i < NUM_ERROR_SOURCES; i = i + 1) begin
                recovery_action[i] <= ACTION_NONE;
                recovery_policy[i] <= ACTION_RETRY;
                retry_count[i] <= 8'd0;
            end
            error_active_reg <= {NUM_ERROR_SOURCES{1'b0}};
            recovery_trigger <= {NUM_ERROR_SOURCES{1'b0}};
            system_reset_req <= 1'b0;
            graceful_shutdown_req <= 1'b0;
            total_errors <= 32'd0;
            recovered_errors <= 32'd0;
            unrecoverable_errors <= 32'd0;
            error_log_valid <= 1'b0;
            log_write_ptr <= 8'd0;
            log_read_ptr <= 8'd0;
            log_valid_bits <= {LOG_DEPTH{1'b0}};
        end else begin
            recovery_trigger <= {NUM_ERROR_SOURCES{1'b0}};
            error_log_valid <= 1'b0;
            for (i = 0; i < NUM_ERROR_SOURCES; i = i + 1) begin
                if (error_detected[i] && !error_mask[i]) begin
                    error_active_reg[i] <= 1'b1;
                    total_errors <= total_errors + 1'b1;
                    log_timestamp[log_write_ptr] <= cycle_counter;
                    log_source[log_write_ptr] <= i[7:0];
                    log_type[log_write_ptr] <= error_type[i];
                    log_data[log_write_ptr] <= error_data[i];
                    log_valid_bits[log_write_ptr] <= 1'b1;
                    log_write_ptr <= log_write_ptr + 1'b1;
                    case (error_type[i])
                        ERR_TRANSIENT: begin
                            if (retry_count[i] < RETRY_LIMIT) begin
                                recovery_action[i] <= ACTION_RETRY;
                                retry_count[i] <= retry_count[i] + 1'b1;
                                recovery_trigger[i] <= 1'b1;
                            end else begin
                                recovery_action[i] <= ACTION_ISOLATE;
                                unrecoverable_errors <= unrecoverable_errors + 1'b1;
                            end
                        end
                        ERR_TIMEOUT: begin
                            if (retry_count[i] < RETRY_LIMIT) begin
                                recovery_action[i] <= ACTION_RETRY;
                                retry_count[i] <= retry_count[i] + 1'b1;
                                recovery_trigger[i] <= 1'b1;
                            end else begin
                                recovery_action[i] <= ACTION_ROLLBACK;
                            end
                        end
                        ERR_PROTOCOL: begin
                            recovery_action[i] <= ACTION_RESET;
                            system_reset_req <= 1'b1;
                            unrecoverable_errors <= unrecoverable_errors + 1'b1;
                        end
                        ERR_DATA_CORRUPTION: begin
                            recovery_action[i] <= ACTION_ROLLBACK;
                            recovery_trigger[i] <= 1'b1;
                        end
                        ERR_HARDWARE: begin
                            recovery_action[i] <= ACTION_DEGRADE;
                            recovery_trigger[i] <= 1'b1;
                        end
                        ERR_FATAL: begin
                            recovery_action[i] <= ACTION_SHUTDOWN;
                            graceful_shutdown_req <= 1'b1;
                            unrecoverable_errors <= unrecoverable_errors + 1'b1;
                        end
                        default: begin
                            recovery_action[i] <= ACTION_RETRY;
                        end
                    endcase
                end
                if (recovery_trigger[i] && recovery_action[i] == ACTION_RETRY) begin
                    error_active_reg[i] <= 1'b0;
                    retry_count[i] <= 8'd0;
                    recovered_errors <= recovered_errors + 1'b1;
                end
            end
            if (log_valid_bits[log_read_ptr] && error_log_ready) begin
                error_log_timestamp <= log_timestamp[log_read_ptr];
                error_log_source <= log_source[log_read_ptr];
                error_log_type <= log_type[log_read_ptr];
                error_log_data <= log_data[log_read_ptr];
                error_log_valid <= 1'b1;
                log_valid_bits[log_read_ptr] <= 1'b0;
                log_read_ptr <= log_read_ptr + 1'b1;
            end
        end
    end
endmodule
```
