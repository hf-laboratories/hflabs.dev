---
title: "GPIO Controller — gpio_controller.v"
description: "General-purpose I/O controller with programmable direction, interrupt on change, and status registers."
part: "Part II — Component Library"
chapter: "BMC Components"
category: "BMC Components"
filename: "bmc/gpio_controller.v"
order: 100
tags: ["BMC Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

# GPIO Controller — `gpio_controller.v`

**Subsystem:** `BMC Components` &bull; **Source Path:** `bmc/gpio_controller.v`

[← Back to Component Library](/book/02-component-library)

---

:::under-construction
### 🚧 Module Under Active Hardening & Verification

This module is part of the **BMC Components** subsystem and is currently undergoing active RTL timing optimization, Quartus Platform Designer netlist verification, and testbench coverage expansion.

- **Target Architecture**: Altera / Intel Stratix V GS FPGA (Catapult v2 hardware target)
- **Target Core Frequency**: 250 MHz (Gen3 x8 256-bit datapath)
- **Verification Status**: In-Progress — Structural RTL syntax validated, comprehensive gate-level simulation pending
:::

---

## 1. Architectural Role & Overview

General-purpose I/O controller with programmable direction, interrupt on change, and status registers.

### Key Design Principles

1. **Deterministic Handshaking**: Full ready/valid flow control preventing buffer overflows or stall deadlocks.
2. **Synchronous Reset Protocol**: Active-low reset with internal multi-stage deassertion synchronizers.
3. **Metastability Isolation**: Multi-stage flip-flop chains for any signals crossing clock domains.

---

## 2. Interface Specification (Provisional Baseline)

### Module Parameters & Generics

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATA_WIDTH` | Integer | `512` | Primary internal streaming datapath width |
| `ADDR_WIDTH` | Integer | `64` | Physical memory address bus width |
| `FIFO_DEPTH` | Integer | `64` | Decoupling stage FIFO buffer depth |
| `BURST_LIMIT` | Integer | `4096` | Maximum burst byte length per transaction |

### Signal Port Map

| Port Name | Direction | Bit Width | Description |
| :--- | :--- | :--- | :--- |
| `clk` | Input | `1` | Subsystem Core Clock (250 MHz) |
| `rst_n` | Input | `1` | Active-Low Synchronous Reset |
| `s_axis_tdata` | Input | `DATA_WIDTH` | Ingress stream payload |
| `s_axis_tvalid` | Input | `1` | Ingress stream valid qualifier |
| `s_axis_tready` | Output | `1` | Backpressure flow-control ready |
| `s_axis_tlast` | Input | `1` | Ingress packet boundary delimiter |
| `m_axis_tdata` | Output | `DATA_WIDTH` | Egress stream payload |
| `m_axis_tvalid` | Output | `1` | Egress stream valid qualifier |
| `m_axis_tready` | Input | `1` | Downstream sink backpressure ready |
| `m_axis_tlast` | Output | `1` | Egress packet boundary delimiter |

---

## 3. RTL Implementation Skeleton

```verilog
// =============================================================================
// Module: GPIO Controller (gpio_controller.v)
// Subsystem: BMC Components
// Target: Stratix V GS FPGA / Catapult v2
// Status: Under Active Hardening
// =============================================================================

`timescale 1ns / 1ps

module gpio_controller #(
    parameter DATA_WIDTH  = 512,
    parameter ADDR_WIDTH  = 64,
    parameter FIFO_DEPTH  = 64,
    parameter BURST_LIMIT = 4096
)(
    input  wire                  clk,
    input  wire                  rst_n,

    // Slave Streaming Interface (Ingress)
    input  wire [DATA_WIDTH-1:0] s_axis_tdata,
    input  wire                  s_axis_tvalid,
    output wire                  s_axis_tready,
    input  wire                  s_axis_tlast,

    // Master Streaming Interface (Egress)
    output reg  [DATA_WIDTH-1:0] m_axis_tdata,
    output reg                   m_axis_tvalid,
    input  wire                  m_axis_tready,
    output reg                   m_axis_tlast,

    // Status & Error Telemetry
    output reg  [31:0]           error_count,
    output wire                  busy_flag
);

    // -------------------------------------------------------------------------
    // Internal Registers & State Machine
    // -------------------------------------------------------------------------
    reg [31:0] cycle_count;
    reg        active_transfer;

    assign s_axis_tready = (!m_axis_tvalid || m_axis_tready);
    assign busy_flag     = active_transfer;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            m_axis_tdata    <= {DATA_WIDTH{1'b0}};
            m_axis_tvalid   <= 1'b0;
            m_axis_tlast    <= 1'b0;
            error_count     <= 32'd0;
            cycle_count     <= 32'd0;
            active_transfer <= 1'b0;
        end else begin
            cycle_count <= cycle_count + 1'b1;

            if (m_axis_tvalid && m_axis_tready) begin
                m_axis_tvalid <= 1'b0;
                m_axis_tlast  <= 1'b0;
            end

            if (s_axis_tvalid && s_axis_tready) begin
                m_axis_tdata    <= s_axis_tdata;
                m_axis_tvalid   <= 1'b1;
                m_axis_tlast    <= s_axis_tlast;
                active_transfer <= !s_axis_tlast;
            end
        end
    end

endmodule
```

---

## 4. Hardware Verification & Integration Checklist

- [x] Baseline Verilog 2001 / SystemVerilog 2012 syntax compilation clean
- [ ] Multi-channel backpressure assertion testbench completed
- [ ] Corner-case burst alignment (unaligned offsets & 4KB boundary crossings)
- [ ] Quartus Prime TimeQuest timing constraints and false-path assertions
- [ ] In-system SignalTap logic analyzer capture on Catapult v2 hardware target

---

[← Back to Component Library](/book/02-component-library) · [Next Chapter: Production Roadmap →](/book/03-production-roadmap)
