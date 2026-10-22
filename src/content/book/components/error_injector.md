---
title: "Error Injector — error_injector.v"
description: "Hardware fault injection module simulating bit flips, CRC corruptions, and timeout delays."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/error_injector.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/error_injector.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/error_injector.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Error Injector — error_injector.v

**Filename:** `util/error_injector.v`

## Description

Provides controlled, configurable error injection for validation and resilience testing. Supports multiple error classes, rate/burst triggering, and MMIO-style control/status registers.

- Selective per-error-type enable mask
- Continuous, random, periodic, and burst injection modes
- Error type/severity coding
- Injection statistics and active-state outputs

## Integration Points

- Validation and fault-injection campaigns in simulation/emulation
- Stress testing for recovery and observability paths
- Pairs naturally with `advanced_error_recovery.v` and testbenches

## Verilog Source

```verilog
// Error Injection Module
// Provides controlled error injection for testing and validation
// Supports link errors, TLP errors, timeouts, and protocol violations

module error_injector #(
    parameter NUM_ERROR_TYPES = 8
)(
    input  wire                         clk,
    input  wire                         rst_n,
    // Control interface (MMIO)
    input  wire [31:0]                  control_addr,
    input  wire [31:0]                  control_wr_data,
    input  wire                         control_wr_en,
    input  wire                         control_rd_en,
    output reg  [31:0]                  control_rd_data,
    output reg                          control_rd_valid,
    // Error injection outputs
    output reg                          inject_link_error,
    output reg                          inject_tlp_error,
    output reg                          inject_completion_timeout,
    output reg                          inject_command_error,
    output reg                          inject_memory_error,
    output reg                          inject_dma_error,
    output reg                          inject_interrupt_error,
    output reg                          inject_protocol_violation,
    // Error type and severity
    output reg  [1:0]                   error_type,
    output reg  [3:0]                   error_code,
    // Statistics
    output reg  [31:0]                  total_errors_injected,
    output wire [NUM_ERROR_TYPES-1:0]   error_injection_active
);
    // Register map
    localparam REG_CONTROL          = 8'h00;
    localparam REG_ERROR_ENABLE     = 8'h04;
    localparam REG_ERROR_RATE       = 8'h08;
    localparam REG_ERROR_TYPE       = 8'h0C;
    localparam REG_ERROR_CODE       = 8'h10;
    localparam REG_ERROR_COUNT      = 8'h14;
    localparam REG_TRIGGER_SINGLE   = 8'h18;
    localparam REG_TRIGGER_BURST    = 8'h1C;
    localparam REG_STATUS           = 8'h20;
    // Control bits
    localparam CTRL_ENABLE          = 0;
    localparam CTRL_CONTINUOUS      = 1;
    localparam CTRL_RANDOM          = 2;
    localparam CTRL_RESET_COUNTERS  = 3;
    // Internal registers
    reg [31:0] control_reg;
    reg [NUM_ERROR_TYPES-1:0] error_enable_mask;
    reg [31:0] error_rate;
    reg [31:0] cycle_counter;
    reg [31:0] random_seed;
    reg [15:0] burst_count;
    reg [15:0] burst_remaining;
    // Error injection state
    reg [NUM_ERROR_TYPES-1:0] error_active;
    reg [2:0] current_error_type;
    assign error_injection_active = error_active;
    // LFSR for random number generation
    reg [31:0] lfsr;
    wire [31:0] lfsr_next;
    assign lfsr_next = {lfsr[30:0], lfsr[31] ^ lfsr[21] ^ lfsr[1] ^ lfsr[0]};
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            lfsr <= 32'hACE1FACE;
        end else begin
            lfsr <= lfsr_next;
        end
    end
    // MMIO register interface
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            control_rd_data <= 32'd0;
            control_rd_valid <= 1'b0;
        end else begin
            control_rd_valid <= control_rd_en;
            if (control_rd_en) begin
                case (control_addr[7:0])
                    REG_CONTROL:        control_rd_data <= control_reg;
                    REG_ERROR_ENABLE:   control_rd_data <= {{(32-NUM_ERROR_TYPES){1'b0}}, error_enable_mask};
                    REG_ERROR_RATE:     control_rd_data <= error_rate;
                    REG_ERROR_TYPE:     control_rd_data <= {30'd0, error_type};
                    REG_ERROR_CODE:     control_rd_data <= {28'd0, error_code};
                    REG_ERROR_COUNT:    control_rd_data <= total_errors_injected;
                    REG_STATUS:         control_rd_data <= {{(32-NUM_ERROR_TYPES){1'b0}}, error_active};
                    default:            control_rd_data <= 32'd0;
                endcase
            end
        end
    end
    // MMIO register writes
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            control_reg <= 32'd0;
            error_enable_mask <= {NUM_ERROR_TYPES{1'b0}};
            error_rate <= 32'd1000;
            error_type <= 2'b00;
            error_code <= 4'd0;
            burst_count <= 16'd0;
        end else if (control_wr_en) begin
            case (control_addr[7:0])
                REG_CONTROL: begin
                    control_reg <= control_wr_data;
                    if (control_wr_data[CTRL_RESET_COUNTERS]) begin
                        control_reg[CTRL_RESET_COUNTERS] <= 1'b0;
                    end
                end
                REG_ERROR_ENABLE:   error_enable_mask <= control_wr_data[NUM_ERROR_TYPES-1:0];
                REG_ERROR_RATE:     error_rate <= control_wr_data;
                REG_ERROR_TYPE:     error_type <= control_wr_data[1:0];
                REG_ERROR_CODE:     error_code <= control_wr_data[3:0];
                REG_TRIGGER_SINGLE: burst_count <= 16'd1;
                REG_TRIGGER_BURST:  burst_count <= control_wr_data[15:0];
            endcase
        end
    end
    // Error injection logic
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            inject_link_error <= 1'b0;
            inject_tlp_error <= 1'b0;
            inject_completion_timeout <= 1'b0;
            inject_command_error <= 1'b0;
            inject_memory_error <= 1'b0;
            inject_dma_error <= 1'b0;
            inject_interrupt_error <= 1'b0;
            inject_protocol_violation <= 1'b0;
            total_errors_injected <= 32'd0;
            cycle_counter <= 32'd0;
            burst_remaining <= 16'd0;
            error_active <= {NUM_ERROR_TYPES{1'b0}};
            current_error_type <= 3'd0;
        end else begin
            inject_link_error <= 1'b0;
            inject_tlp_error <= 1'b0;
            inject_completion_timeout <= 1'b0;
            inject_command_error <= 1'b0;
            inject_memory_error <= 1'b0;
            inject_dma_error <= 1'b0;
            inject_interrupt_error <= 1'b0;
            inject_protocol_violation <= 1'b0;
            if (control_reg[CTRL_RESET_COUNTERS]) begin
                total_errors_injected <= 32'd0;
                cycle_counter <= 32'd0;
            end else if (control_reg[CTRL_ENABLE]) begin
                cycle_counter <= cycle_counter + 1'b1;
                if (burst_count > 0 && burst_remaining == 0) begin
                    burst_remaining <= burst_count;
                    burst_count <= 16'd0;
                end
                if (burst_remaining > 0) begin
                    burst_remaining <= burst_remaining - 1'b1;
                    inject_errors();
                end else if (control_reg[CTRL_CONTINUOUS]) begin
                    if (control_reg[CTRL_RANDOM]) begin
                        if ((lfsr[31:0] % 1000000) < error_rate) begin
                            inject_errors();
                        end
                    end else if (cycle_counter % (1000000 / error_rate) == 0) begin
                        inject_errors();
                    end
                end
            end
        end
    end
    // Task to inject errors based on enabled mask
    task inject_errors;
        begin
            for (integer i = 0; i < NUM_ERROR_TYPES; i = i + 1) begin
                if (error_enable_mask[i] && i == current_error_type) begin
                    case (i)
                        0: inject_link_error <= 1'b1;
                        1: inject_tlp_error <= 1'b1;
                        2: inject_completion_timeout <= 1'b1;
                        3: inject_command_error <= 1'b1;
                        4: inject_memory_error <= 1'b1;
                        5: inject_dma_error <= 1'b1;
                        6: inject_interrupt_error <= 1'b1;
                        7: inject_protocol_violation <= 1'b1;
                    endcase
                    error_active[i] <= 1'b1;
                    total_errors_injected <= total_errors_injected + 1'b1;
                end else begin
                    error_active[i] <= 1'b0;
                end
            end
            if (current_error_type == NUM_ERROR_TYPES - 1)
                current_error_type <= 3'd0;
            else
                current_error_type <= current_error_type + 1'b1;
        end
    endtask
endmodule
```
