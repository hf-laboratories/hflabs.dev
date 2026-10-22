---
title: "Clock Domain Crossing — clock_domain_crossing.v"
description: "Configurable multi-mode CDC wrapper supporting SYNC, HANDSHAKE, and ASYNC_FIFO modes."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/clock_domain_crossing.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/clock_domain_crossing.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/clock_domain_crossing.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Clock Domain Crossing — clock_domain_crossing.v

**Filename:** `util/clock_domain_crossing.v`

## Description

Provides a configurable CDC wrapper supporting three transfer modes:

- `SYNC`: multi-stage synchronizer for simple/control transfers
- `HANDSHAKE`: robust request/ack transfer for coherent payload handoff
- `ASYNC_FIFO`: FIFO-based CDC for higher-throughput crossings

## Integration Points

- Generic CDC boundary block between source and destination domains
- Used where different latency/throughput tradeoffs are required per path
- Can surface overflow/underflow telemetry in FIFO mode

## Verilog Source

```verilog
// Clock Domain Crossing Module
// Provides safe data transfer between multiple clock domains
// Supports 2-FF synchronizer, handshake, and FIFO-based CDC

module clock_domain_crossing #(
    parameter DATA_WIDTH = 32,
    parameter SYNC_STAGES = 2,
    parameter FIFO_DEPTH = 8,
    parameter CDC_TYPE = "HANDSHAKE"  // "SYNC", "HANDSHAKE", or "ASYNC_FIFO"
)(
    // Source clock domain
    input  wire                     src_clk,
    input  wire                     src_rst_n,
    input  wire [DATA_WIDTH-1:0]    src_data,
    input  wire                     src_valid,
    output wire                     src_ready,
    // Destination clock domain
    input  wire                     dst_clk,
    input  wire                     dst_rst_n,
    output wire [DATA_WIDTH-1:0]    dst_data,
    output wire                     dst_valid,
    input  wire                     dst_ready,
    // Status
    output wire                     overflow,
    output wire                     underflow
);
    generate
        if (CDC_TYPE == "SYNC") begin : gen_sync_cdc
            reg [DATA_WIDTH-1:0] sync_reg [0:SYNC_STAGES-1];
            reg sync_valid [0:SYNC_STAGES-1];
            integer i;
            always @(posedge dst_clk or negedge dst_rst_n) begin
                if (!dst_rst_n) begin
                    for (i = 0; i < SYNC_STAGES; i = i + 1) begin
                        sync_reg[i] <= {DATA_WIDTH{1'b0}};
                        sync_valid[i] <= 1'b0;
                    end
                end else begin
                    sync_reg[0] <= src_data;
                    sync_valid[0] <= src_valid;
                    for (i = 1; i < SYNC_STAGES; i = i + 1) begin
                        sync_reg[i] <= sync_reg[i-1];
                        sync_valid[i] <= sync_valid[i-1];
                    end
                end
            end
            assign dst_data = sync_reg[SYNC_STAGES-1];
            assign dst_valid = sync_valid[SYNC_STAGES-1];
            assign src_ready = 1'b1;
            assign overflow = 1'b0;
            assign underflow = 1'b0;
        end else if (CDC_TYPE == "HANDSHAKE") begin : gen_handshake_cdc
            reg [DATA_WIDTH-1:0] data_reg;
            reg src_req;
            reg dst_ack;
            wire src_ack_sync;
            wire dst_req_sync;
            reg [SYNC_STAGES-1:0] req_sync;
            always @(posedge dst_clk or negedge dst_rst_n) begin
                if (!dst_rst_n)
                    req_sync <= {SYNC_STAGES{1'b0}};
                else
                    req_sync <= {req_sync[SYNC_STAGES-2:0], src_req};
            end
            assign dst_req_sync = req_sync[SYNC_STAGES-1];
            reg [SYNC_STAGES-1:0] ack_sync;
            always @(posedge src_clk or negedge src_rst_n) begin
                if (!src_rst_n)
                    ack_sync <= {SYNC_STAGES{1'b0}};
                else
                    ack_sync <= {ack_sync[SYNC_STAGES-2:0], dst_ack};
            end
            assign src_ack_sync = ack_sync[SYNC_STAGES-1];
            reg src_busy;
            always @(posedge src_clk or negedge src_rst_n) begin
                if (!src_rst_n) begin
                    data_reg <= {DATA_WIDTH{1'b0}};
                    src_req <= 1'b0;
                    src_busy <= 1'b0;
                end else begin
                    if (src_valid && src_ready && !src_busy) begin
                        data_reg <= src_data;
                        src_req <= ~src_req;
                        src_busy <= 1'b1;
                    end else if (src_busy && (src_req == src_ack_sync)) begin
                        src_busy <= 1'b0;
                    end
                end
            end
            assign src_ready = !src_busy;
            reg dst_valid_reg;
            reg dst_req_prev;
            always @(posedge dst_clk or negedge dst_rst_n) begin
                if (!dst_rst_n) begin
                    dst_ack <= 1'b0;
                    dst_valid_reg <= 1'b0;
                    dst_req_prev <= 1'b0;
                end else begin
                    dst_req_prev <= dst_req_sync;
                    if (dst_req_sync != dst_req_prev) begin
                        dst_valid_reg <= 1'b1;
                        dst_ack <= dst_req_sync;
                    end else if (dst_valid_reg && dst_ready) begin
                        dst_valid_reg <= 1'b0;
                    end
                end
            end
            assign dst_data = data_reg;
            assign dst_valid = dst_valid_reg;
            assign overflow = 1'b0;
            assign underflow = 1'b0;
        end else if (CDC_TYPE == "ASYNC_FIFO") begin : gen_async_fifo_cdc
            localparam ADDR_WIDTH = $clog2(FIFO_DEPTH);
            reg [DATA_WIDTH-1:0] fifo_mem [0:FIFO_DEPTH-1];
            reg [ADDR_WIDTH:0] wr_ptr;
            reg [ADDR_WIDTH:0] rd_ptr;
            reg [ADDR_WIDTH:0] wr_ptr_gray;
            reg [ADDR_WIDTH:0] rd_ptr_gray;
            function [ADDR_WIDTH:0] bin2gray;
                input [ADDR_WIDTH:0] binary;
                begin
                    bin2gray = binary ^ (binary >> 1);
                end
            endfunction
            function [ADDR_WIDTH:0] gray2bin;
                input [ADDR_WIDTH:0] gray;
                integer i;
                begin
                    gray2bin[ADDR_WIDTH] = gray[ADDR_WIDTH];
                    for (i = ADDR_WIDTH-1; i >= 0; i = i - 1)
                        gray2bin[i] = gray2bin[i+1] ^ gray[i];
                end
            endfunction
            reg [ADDR_WIDTH:0] wr_ptr_sync [0:SYNC_STAGES-1];
            integer j;
            always @(posedge dst_clk or negedge dst_rst_n) begin
                if (!dst_rst_n) begin
                    for (j = 0; j < SYNC_STAGES; j = j + 1)
                        wr_ptr_sync[j] <= {(ADDR_WIDTH+1){1'b0}};
                end else begin
                    wr_ptr_sync[0] <= wr_ptr_gray;
                    for (j = 1; j < SYNC_STAGES; j = j + 1)
                        wr_ptr_sync[j] <= wr_ptr_sync[j-1];
                end
            end
            wire [ADDR_WIDTH:0] wr_ptr_sync_bin = gray2bin(wr_ptr_sync[SYNC_STAGES-1]);
            reg [ADDR_WIDTH:0] rd_ptr_sync [0:SYNC_STAGES-1];
            integer k;
            always @(posedge src_clk or negedge src_rst_n) begin
                if (!src_rst_n) begin
                    for (k = 0; k < SYNC_STAGES; k = k + 1)
                        rd_ptr_sync[k] <= {(ADDR_WIDTH+1){1'b0}};
                end else begin
                    rd_ptr_sync[0] <= rd_ptr_gray;
                    for (k = 1; k < SYNC_STAGES; k = k + 1)
                        rd_ptr_sync[k] <= rd_ptr_sync[k-1];
                end
            end
            wire [ADDR_WIDTH:0] rd_ptr_sync_bin = gray2bin(rd_ptr_sync[SYNC_STAGES-1]);
            wire fifo_full = (wr_ptr[ADDR_WIDTH] != rd_ptr_sync_bin[ADDR_WIDTH]) &&
                           (wr_ptr[ADDR_WIDTH-1:0] == rd_ptr_sync_bin[ADDR_WIDTH-1:0]);
            always @(posedge src_clk or negedge src_rst_n) begin
                if (!src_rst_n) begin
                    wr_ptr <= {(ADDR_WIDTH+1){1'b0}};
                    wr_ptr_gray <= {(ADDR_WIDTH+1){1'b0}};
                end else if (src_valid && !fifo_full) begin
                    fifo_mem[wr_ptr[ADDR_WIDTH-1:0]] <= src_data;
                    wr_ptr <= wr_ptr + 1'b1;
                    wr_ptr_gray <= bin2gray(wr_ptr + 1'b1);
                end
            end
            assign src_ready = !fifo_full;
            wire fifo_empty = (rd_ptr == wr_ptr_sync_bin);
            reg dst_valid_reg;
            reg [DATA_WIDTH-1:0] dst_data_reg;
            always @(posedge dst_clk or negedge dst_rst_n) begin
                if (!dst_rst_n) begin
                    rd_ptr <= {(ADDR_WIDTH+1){1'b0}};
                    rd_ptr_gray <= {(ADDR_WIDTH+1){1'b0}};
                    dst_valid_reg <= 1'b0;
                    dst_data_reg <= {DATA_WIDTH{1'b0}};
                end else begin
                    if (!fifo_empty && (!dst_valid_reg || dst_ready)) begin
                        dst_data_reg <= fifo_mem[rd_ptr[ADDR_WIDTH-1:0]];
                        dst_valid_reg <= 1'b1;
                        rd_ptr <= rd_ptr + 1'b1;
                        rd_ptr_gray <= bin2gray(rd_ptr + 1'b1);
                    end else if (dst_valid_reg && dst_ready) begin
                        dst_valid_reg <= 1'b0;
                    end
                end
            end
            assign dst_data = dst_data_reg;
            assign dst_valid = dst_valid_reg;
            reg overflow_reg, underflow_reg;
            always @(posedge src_clk or negedge src_rst_n) begin
                if (!src_rst_n)
                    overflow_reg <= 1'b0;
                else if (src_valid && fifo_full)
                    overflow_reg <= 1'b1;
            end
            always @(posedge dst_clk or negedge dst_rst_n) begin
                if (!dst_rst_n)
                    underflow_reg <= 1'b0;
                else if (dst_ready && !dst_valid_reg)
                    underflow_reg <= 1'b1;
            end
            assign overflow = overflow_reg;
            assign underflow = underflow_reg;
        end
    endgenerate
endmodule
```
