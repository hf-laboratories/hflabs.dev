---
title: "Round-Robin Arbiter — arbiter_rr.v"
description: "Implements a round-robin arbitration scheme for multiple requestors with priority masking."
part: "Part II — Component Library"
chapter: "Utility Modules"
category: "Utility Modules"
filename: "util/arbiter_rr.v"
order: 100
tags: ["Utility Modules", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/arbiter_rr.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/util/arbiter_rr.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Round-Robin Arbiter — arbiter_rr.v

**Filename:** `util/arbiter_rr.v`

## Description

Implements a round-robin arbitration scheme for multiple requestors. Ensures fair access by rotating priority after each grant.

- Parameterized number of ports
- Masked/unmasked priority encoding
- Fairness through rotating mask

## Integration Points

- Shared-resource arbitration (DMA channels, queues, engines)
- Bus/stream request scheduling across multiple requestors

## Verilog Source

```verilog
// Round-robin arbiter for multiple requestors
module arbiter_rr #(
    parameter NUM_PORTS = 4
)(
    input  wire                     clk,
    input  wire                     rst_n,
    // Request and grant signals
    input  wire [NUM_PORTS-1:0]     request,
    output reg  [NUM_PORTS-1:0]     grant
);
    reg [NUM_PORTS-1:0] priority_mask;
    wire [NUM_PORTS-1:0] masked_request;
    wire [NUM_PORTS-1:0] unmasked_request;
    wire [NUM_PORTS-1:0] masked_grant;
    wire [NUM_PORTS-1:0] unmasked_grant;
    // Apply priority mask
    assign masked_request = request & priority_mask;
    assign unmasked_request = request;
    // Priority encoder for masked requests
    generate
        genvar i;
        for (i = 0; i < NUM_PORTS; i = i + 1) begin : gen_masked_grant
            if (i == 0) begin
                assign masked_grant[i] = masked_request[i];
            end else begin
                assign masked_grant[i] = masked_request[i] && ~(|masked_request[i-1:0]);
            end
        end
    endgenerate
    // Priority encoder for unmasked requests
    generate
        for (i = 0; i < NUM_PORTS; i = i + 1) begin : gen_unmasked_grant
            if (i == 0) begin
                assign unmasked_grant[i] = unmasked_request[i];
            end else begin
                assign unmasked_grant[i] = unmasked_request[i] && ~(|unmasked_request[i-1:0]);
            end
        end
    endgenerate
    // Select grant (use masked if any masked request exists)
    wire any_masked = |masked_request;
    always @(*) begin
        if (any_masked)
            grant = masked_grant;
        else
            grant = unmasked_grant;
    end
    // Update priority mask after grant
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            priority_mask <= {NUM_PORTS{1'b1}};
        end else if (|grant) begin
            reg [NUM_PORTS-1:0] new_mask;
            new_mask = {NUM_PORTS{1'b1}} << (grant_to_index(grant) + 1'b1);
            if (new_mask == {NUM_PORTS{1'b0}})
                priority_mask <= {NUM_PORTS{1'b1}};
            else
                priority_mask <= new_mask;
        end
    end
    // Convert one-hot grant to binary index
    function integer grant_to_index;
        input [NUM_PORTS-1:0] grant_signal;
        integer i;
        begin
            grant_to_index = 0;
            for (i = 0; i < NUM_PORTS; i = i + 1) begin
                if (grant_signal[i])
                    grant_to_index = i;
            end
        end
    endfunction
endmodule
```
