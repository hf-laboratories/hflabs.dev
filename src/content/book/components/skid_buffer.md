---
title: "Skid Buffer — skid_buffer.v"
description: "Zero-latency pipeline skid buffer breaking combinational backpressure timing loops on AXI-Stream."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/skid_buffer.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/skid_buffer.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/skid_buffer.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Skid Buffer — skid_buffer.v

**Filename:** `util/skid_buffer.v`

## Description

Implements an AXI-Stream style flow control buffer. The skid buffer allows for safe back-pressure handling without creating combinational paths through valid/ready signals. It ensures robust data transfer in pipelined designs.

- Handles back-pressure cleanly
- Avoids combinational valid/ready paths
- Suitable for high-speed streaming interfaces

## Integration Points

- Inserted between modules to decouple valid/ready handshake timing
- Used in high-throughput streaming data paths

## Verilog Source

```verilog
// Skid Buffer - AXI-Stream style flow control buffer
// Allows back-pressure without combinational paths through valid/ready
module skid_buffer #(
    parameter DATA_WIDTH = 32
)(
    input  wire                     clk,
    input  wire                     rst_n,
    // Input interface
    input  wire [DATA_WIDTH-1:0]    s_data,
    input  wire                     s_valid,
    output reg                      s_ready,
    // Output interface
    output reg  [DATA_WIDTH-1:0]    m_data,
    output reg                      m_valid,
    input  wire                     m_ready
);
    reg [DATA_WIDTH-1:0] skid_data;
    reg                  skid_valid;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            m_data      <= {DATA_WIDTH{1'b0}};
            m_valid     <= 1'b0;
            skid_data   <= {DATA_WIDTH{1'b0}};
            skid_valid  <= 1'b0;
            s_ready     <= 1'b1;
        end else begin
            // Default: ready to accept if no skid data pending
            s_ready <= !skid_valid;
            // Handle output transfers
            if (m_valid && m_ready) begin
                // Transfer completed
                if (skid_valid) begin
                    // Move skid buffer to output
                    m_data     <= skid_data;
                    m_valid    <= 1'b1;
                    skid_valid <= 1'b0;
                end else if (s_valid && s_ready) begin
                    // Direct pass-through
                    m_data  <= s_data;
                    m_valid <= 1'b1;
                end else begin
                    // No new data
                    m_valid <= 1'b0;
                end
            end else if (!m_valid || !m_ready) begin
                // Output is stalled or empty
                if (s_valid && s_ready) begin
                    if (!m_valid) begin
                        // Direct transfer to output
                        m_data  <= s_data;
                        m_valid <= 1'b1;
                    end else begin
                        // Store in skid buffer
                        skid_data  <= s_data;
                        skid_valid <= 1'b1;
                    end
                end
            end
        end
    end
endmodule
```
