---
title: "Width Converter — width_converter.v"
description: "Bidirectional streaming data width converter with internal buffering and backpressure flow control."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/width_converter.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/width_converter.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/width_converter.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Width Converter — width_converter.v

**Filename:** `util/width_converter.v`

## Description

Converts between different data path widths with proper buffering. Supports both upsizing (narrow to wide) and downsizing (wide to narrow). Used for safe, parameterized width translation at PCIe↔DMA boundaries.

- Bidirectional conversion (upsizing/downsizing)
- Buffering and flow-control
- `last` signal propagation
- Parameterized power-of-two width ratios
- Back-pressure via ready/valid handshakes

## Integration Points

- PCIe↔DMA boundaries in top-level modules
- Used by `pcie_dma_width_adapter` and `dma_pcie_width_adapter`
- Testbench coverage in `tb_dma_engine.v`

## Verilog Source

```verilog
// Width Converter Module
// Converts between different data path widths with proper buffering
// Supports both upsizing (narrow to wide) and downsizing (wide to narrow)

module width_converter #(
    parameter INPUT_WIDTH = 256,
    parameter OUTPUT_WIDTH = 512,
    parameter RATIO = OUTPUT_WIDTH / INPUT_WIDTH  // Must be power of 2
)(
    input  wire                         clk,
    input  wire                         rst_n,
    // Input interface (narrow)
    input  wire [INPUT_WIDTH-1:0]       s_data,
    input  wire                         s_valid,
    input  wire                         s_last,
    output reg                          s_ready,
    // Output interface (wide)
    output reg  [OUTPUT_WIDTH-1:0]      m_data,
    output reg                          m_valid,
    output reg                          m_last,
    input  wire                         m_ready
);
    // For upsizing: accumulate narrow beats into wide beat
    generate
        if (OUTPUT_WIDTH > INPUT_WIDTH) begin : gen_upsize
            reg [OUTPUT_WIDTH-1:0] data_buffer;
            reg [$clog2(RATIO)-1:0] beat_count;
            reg last_seen;
            always @(posedge clk or negedge rst_n) begin
                if (!rst_n) begin
                    data_buffer <= {OUTPUT_WIDTH{1'b0}};
                    beat_count <= 0;
                    last_seen <= 1'b0;
                    m_valid <= 1'b0;
                    m_last <= 1'b0;
                    s_ready <= 1'b1;
                end else begin
                    // Default ready unless outputting
                    s_ready <= !m_valid || m_ready;
                    if (m_valid && m_ready) begin
                        // Output consumed
                        m_valid <= 1'b0;
                        m_last <= 1'b0;
                        s_ready <= 1'b1;
                    end
                    if (s_valid && s_ready) begin
                        // Accumulate input data
                        data_buffer[beat_count*INPUT_WIDTH +: INPUT_WIDTH] <= s_data;
                        if (s_last) begin
                            last_seen <= 1'b1;
                        end
                        if (beat_count == RATIO - 1 || s_last) begin
                            // Buffer full or last beat, output it
                            m_data <= data_buffer | (s_data << (beat_count * INPUT_WIDTH));
                            m_valid <= 1'b1;
                            m_last <= s_last;
                            beat_count <= 0;
                            last_seen <= 1'b0;
                            s_ready <= 1'b0;
                        end else begin
                            beat_count <= beat_count + 1'b1;
                        end
                    end
                end
            end
        end else if (OUTPUT_WIDTH < INPUT_WIDTH) begin : gen_downsize
            // For downsizing: split wide beat into narrow beats
            reg [INPUT_WIDTH-1:0] data_buffer;
            reg [$clog2(RATIO)-1:0] beat_count;
            reg last_buffer;
            reg valid_buffer;
            localparam DOWN_RATIO = INPUT_WIDTH / OUTPUT_WIDTH;
            always @(posedge clk or negedge rst_n) begin
                if (!rst_n) begin
                    data_buffer <= {INPUT_WIDTH{1'b0}};
                    beat_count <= 0;
                    last_buffer <= 1'b0;
                    valid_buffer <= 1'b0;
                    m_valid <= 1'b0;
                    m_last <= 1'b0;
                    s_ready <= 1'b1;
                end else begin
                    // Ready when not buffering or last beat being output
                    s_ready <= !valid_buffer || (beat_count == DOWN_RATIO - 1 && m_ready);
                    if (m_valid && m_ready) begin
                        if (beat_count == DOWN_RATIO - 1) begin
                            // Last segment output
                            m_valid <= 1'b0;
                            m_last <= 1'b0;
                            valid_buffer <= 1'b0;
                        end else begin
                            // Output next segment
                            beat_count <= beat_count + 1'b1;
                            m_data <= data_buffer[((beat_count + 1) * OUTPUT_WIDTH) +: OUTPUT_WIDTH];
                            m_last <= (beat_count == DOWN_RATIO - 2) && last_buffer;
                        end
                    end
                    if (s_valid && s_ready && !valid_buffer) begin
                        // Latch input data
                        data_buffer <= s_data;
                        last_buffer <= s_last;
                        valid_buffer <= 1'b1;
                        beat_count <= 0;
                        // Output first segment
                        m_data <= s_data[OUTPUT_WIDTH-1:0];
                        m_valid <= 1'b1;
                        m_last <= (DOWN_RATIO == 1) && s_last;
                    end
                end
            end
        end else begin : gen_passthrough
            // Same width, just pass through with registered path
            always @(posedge clk or negedge rst_n) begin
                if (!rst_n) begin
                    m_data <= {OUTPUT_WIDTH{1'b0}};
                    m_valid <= 1'b0;
                    m_last <= 1'b0;
                    s_ready <= 1'b1;
                end else begin
                    s_ready <= !m_valid || m_ready;
                    if (s_valid && s_ready) begin
                        m_data <= s_data;
                        m_valid <= 1'b1;
                        m_last <= s_last;
                    end else if (m_ready) begin
                        m_valid <= 1'b0;
                        m_last <= 1'b0;
                    end
                end
            end
        end
    endgenerate
endmodule
```
