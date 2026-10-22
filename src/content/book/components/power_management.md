---
title: "Power Management — power_management.v"
description: "Dynamic clock gating and power plane manager supporting low-power standby and thermal throttling."
part: "Part II — Component Library"
chapter: "Power Management Components"
category: "Power Management Components"
filename: "power/power_management.v"
order: 100
tags: ["Power Management Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/power_management.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/power/power_management.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Power Management — power_management.v

**Filename:** `power/power_management.v`

## Description

Implements ACPI-like power-state management with domain-level gating/isolation controls, clock-domain scaling, transition sequencing, and runtime power accounting counters.

## Integration Points

- System-wide power policy controller for FPGA power and clock domains
- Drives domain power-gate, isolation, retention, and clock-enable control vectors
- Exposes config read/write hooks for software-side power policy tuning and telemetry collection
- Coordinates low-power transitions that interact with activity monitors and subsystem readiness

## Verilog Source

```verilog
module power_management #(
    parameter NUM_POWER_DOMAINS = 8,
    parameter NUM_CLOCK_DOMAINS = 16
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [2:0]                   target_power_state,
    input  wire                         power_state_change_req,
    output reg  [2:0]                   current_power_state,
    output reg                          power_state_change_ack,
    output reg                          power_state_stable,
    input  wire [NUM_POWER_DOMAINS-1:0] domain_enable_req,
    output reg  [NUM_POWER_DOMAINS-1:0] domain_powered,
    output reg  [NUM_POWER_DOMAINS-1:0] domain_clocked,
    output reg  [NUM_CLOCK_DOMAINS-1:0] clock_enable,
    output reg  [3:0]                   clock_divider [0:NUM_CLOCK_DOMAINS-1],
    output reg  [NUM_POWER_DOMAINS-1:0] power_gate_enable,
    output reg  [NUM_POWER_DOMAINS-1:0] isolation_enable,
    output reg  [NUM_POWER_DOMAINS-1:0] retention_enable
);
// Power Management Module
// Implements ACPI-like power states and dynamic power scaling
module power_management #(
    parameter NUM_POWER_DOMAINS = 8,
    parameter NUM_CLOCK_DOMAINS = 16
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [2:0]                   target_power_state,
    input  wire                         power_state_change_req,
    output reg  [2:0]                   current_power_state,
    output reg                          power_state_change_ack,
    output reg                          power_state_stable,
    input  wire [NUM_POWER_DOMAINS-1:0] domain_enable_req,
    output reg  [NUM_POWER_DOMAINS-1:0] domain_powered,
    output reg  [NUM_POWER_DOMAINS-1:0] domain_clocked,
    output reg  [NUM_CLOCK_DOMAINS-1:0] clock_enable,
    output reg  [3:0]                   clock_divider [0:NUM_CLOCK_DOMAINS-1],
    output reg  [NUM_POWER_DOMAINS-1:0] power_gate_enable,
    output reg  [NUM_POWER_DOMAINS-1:0] isolation_enable,
    output reg  [NUM_POWER_DOMAINS-1:0] retention_enable,
    input  wire [NUM_POWER_DOMAINS-1:0] domain_active,
    input  wire [15:0]                  activity_threshold,
    input  wire [31:0]                  config_addr,
    input  wire [31:0]                  config_wr_data,
    input  wire                         config_wr_en,
    input  wire                         config_rd_en,
    output reg  [31:0]                  config_rd_data,
    output reg                          config_rd_valid,
    output reg  [31:0]                  total_power_cycles,
    output reg  [31:0]                  active_power_cycles,
    output reg  [31:0]                  idle_power_cycles,
    output reg  [31:0]                  sleep_power_cycles,
    output reg  [7:0]                   power_efficiency_percent
);
    localparam PS_D0 = 3'd0, PS_D1 = 3'd1, PS_D2 = 3'd2, PS_D3_HOT = 3'd3, PS_D3_COLD = 3'd4;
    localparam IDLE = 3'd0, SAVE_STATE = 3'd1, POWER_DOWN = 3'd2, POWER_UP = 3'd3, RESTORE_STATE = 3'd4, STABLE = 3'd5;
    
    reg [2:0] state;
    reg [2:0] target_state_reg;
    reg [15:0] transition_delay;
    reg [31:0] activity_counter [0:NUM_POWER_DOMAINS-1];
    reg [31:0] idle_counter [0:NUM_POWER_DOMAINS-1];
    reg [NUM_POWER_DOMAINS-1:0] domain_idle;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            config_rd_data <= 32'd0;
            config_rd_valid <= 1'b0;
        end else begin
            config_rd_valid <= config_rd_en;
            if (config_rd_en) config_rd_data <= 32'd0;
        end
    end
    
    integer i;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            for (i = 0; i < NUM_POWER_DOMAINS; i = i + 1) begin
                activity_counter[i] <= 32'd0;
                idle_counter[i] <= 32'd0;
            end
            domain_idle <= {NUM_POWER_DOMAINS{1'b0}};
        end else begin
            for (i = 0; i < NUM_POWER_DOMAINS; i = i + 1) begin
                if (domain_active[i]) begin
                    activity_counter[i] <= activity_counter[i] + 1'b1;
                    idle_counter[i] <= 32'd0;
                    domain_idle[i] <= 1'b0;
                end else begin
                    idle_counter[i] <= idle_counter[i] + 1'b1;
                    if (idle_counter[i] > {16'd0, activity_threshold})
                        domain_idle[i] <= 1'b1;
                end
            end
        end
    end
    
    integer j;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            current_power_state <= PS_D0;
            target_state_reg <= PS_D0;
            power_state_change_ack <= 1'b0;
            power_state_stable <= 1'b1;
            transition_delay <= 16'd0;
            domain_powered <= {NUM_POWER_DOMAINS{1'b1}};
            domain_clocked <= {NUM_POWER_DOMAINS{1'b1}};
            clock_enable <= {NUM_CLOCK_DOMAINS{1'b1}};
            power_gate_enable <= {NUM_POWER_DOMAINS{1'b0}};
            isolation_enable <= {NUM_POWER_DOMAINS{1'b0}};
            retention_enable <= {NUM_POWER_DOMAINS{1'b0}};
            total_power_cycles <= 32'd0;
            active_power_cycles <= 32'd0;
            idle_power_cycles <= 32'd0;
            sleep_power_cycles <= 32'd0;
            power_efficiency_percent <= 8'd0;
            for (j = 0; j < NUM_CLOCK_DOMAINS; j = j + 1)
                clock_divider[j] <= 4'd0;
        end else begin
            total_power_cycles <= total_power_cycles + 1'b1;
            case (current_power_state)
                PS_D0: active_power_cycles <= active_power_cycles + 1'b1;
                PS_D1: idle_power_cycles <= idle_power_cycles + 1'b1;
                default: sleep_power_cycles <= sleep_power_cycles + 1'b1;
            endcase
            if (total_power_cycles > 0) begin
                // Simplified efficiency calculation (approximation)
                power_efficiency_percent <= active_power_cycles[7:0];
            end
            power_state_change_ack <= 1'b0;
            
            case (state)
                IDLE: begin
                    power_state_stable <= 1'b1;
                    if (power_state_change_req) begin
                        target_state_reg <= target_power_state;
                        power_state_stable <= 1'b0;
                        if (target_power_state > current_power_state)
                            state <= SAVE_STATE;
                        else if (target_power_state < current_power_state)
                            state <= POWER_UP;
                        else
                            power_state_change_ack <= 1'b1;
                    end
                end
                SAVE_STATE: begin
                    transition_delay <= 16'd10;
                    state <= POWER_DOWN;
                end
                POWER_DOWN: begin
                    if (transition_delay > 0)
                        transition_delay <= transition_delay - 1'b1;
                    else begin
                        current_power_state <= target_state_reg;
                        state <= STABLE;
                    end
                end
                POWER_UP: begin
                    transition_delay <= 16'd20;
                    power_gate_enable <= {NUM_POWER_DOMAINS{1'b0}};
                    domain_powered <= {NUM_POWER_DOMAINS{1'b1}};
                    if (transition_delay > 0)
                        transition_delay <= transition_delay - 1'b1;
                    else begin
                        clock_enable <= {NUM_CLOCK_DOMAINS{1'b1}};
                        domain_clocked <= {NUM_POWER_DOMAINS{1'b1}};
                        current_power_state <= target_state_reg;
                        state <= RESTORE_STATE;
                    end
                end
                RESTORE_STATE: begin
                    transition_delay <= 16'd10;
                    if (transition_delay > 0)
                        transition_delay <= transition_delay - 1'b1;
                    else
                        state <= STABLE;
                end
                STABLE: begin
                    power_state_stable <= 1'b1;
                    power_state_change_ack <= 1'b1;
                    state <= IDLE;
                end
                default: state <= IDLE;
            endcase
        end
    end
endmodule
endmodule
```
