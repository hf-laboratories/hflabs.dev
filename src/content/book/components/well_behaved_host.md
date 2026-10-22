---
title: "Well-Behaved Host Interface — well_behaved_host.v"
description: "Rate-limiting, watchdog-protected host abstraction boundary shielding accelerators."
part: "Part II — Component Library"
chapter: "Host Interface Components"
category: "Host Interface Components"
filename: "host_interface/well_behaved_host.v"
order: 100
tags: ["Host Interface Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/well_behaved_host.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/host_interface/well_behaved_host.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Well-Behaved Host Interface — well_behaved_host.v

**Filename:** `host_interface/well_behaved_host.v`

## Description

Provides a policy-aware host abstraction layer for accelerator traffic (IPU/GPU/etc.), enforcing compliant request behavior with rate limiting, timeout checks, bandwidth controls, and MMIO-configurable resource allocation.

## Integration Points

- Sits between host PCIe request streams and accelerator-facing read/write interfaces
- Exposes MMIO control/status plane for compliance and allocation policy
- Emits compliance metrics (`pending_requests`, `total_requests`, `violations`) for observability

## README Integration Notes

From `host_interface/README.md`, this component is also the policy-enforcement boundary for “well-behaved host” semantics:

- Enforces configurable rate limiting (request-window based)
- Tracks outstanding requests and timeout violations
- Applies bandwidth ceilings with violation accounting
- Supports fair resource sharing across accelerators (round-robin allocation)
- Exposes MMIO register map for control (`HOST_CONTROL`) and status (`HOST_STATUS`, counters)

Host stream interoperability guidance from the README applies here as well:

- Preserve valid/ready backpressure behavior on host write/read paths
- Align host-side buffer planning to `DATA_WIDTH` (typically 512-bit / 64-byte aligned)

Reference:

- [`../../host_interface/README.md`](../../host_interface/README.md)

## Verilog Source

```verilog
module well_behaved_host #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 512,
    parameter NUM_ACCELERATORS = 4,
    parameter MAX_OUTSTANDING_REQUESTS = 16
)(
    input  wire                         clk,
    input  wire                         rst_n,
    // Host PCIe interface
    input  wire [ADDR_WIDTH-1:0]        host_rd_addr,
    input  wire [10:0]                  host_rd_len,
    input  wire                         host_rd_req,
    output wire                         host_rd_ack,
    output wire [DATA_WIDTH-1:0]        host_rd_data,
    output wire                         host_rd_valid,
    input  wire                         host_rd_ready,
    input  wire [ADDR_WIDTH-1:0]        host_wr_addr,
    input  wire [DATA_WIDTH-1:0]        host_wr_data,
    input  wire [15:0]                  host_wr_len,
    input  wire                         host_wr_valid,
    output wire                         host_wr_ready,
    // Accelerator interfaces
    output wire [ADDR_WIDTH-1:0]        accel_rd_addr [0:NUM_ACCELERATORS-1],
    output wire [10:0]                  accel_rd_len [0:NUM_ACCELERATORS-1],
    output wire [NUM_ACCELERATORS-1:0]  accel_rd_req,
    input  wire [NUM_ACCELERATORS-1:0]  accel_rd_ack,
    input  wire [DATA_WIDTH-1:0]        accel_rd_data [0:NUM_ACCELERATORS-1],
    input  wire [NUM_ACCELERATORS-1:0]  accel_rd_valid,
    output wire [NUM_ACCELERATORS-1:0]  accel_rd_ready,
    output wire [ADDR_WIDTH-1:0]        accel_wr_addr [0:NUM_ACCELERATORS-1],
    output wire [DATA_WIDTH-1:0]        accel_wr_data [0:NUM_ACCELERATORS-1],
    output wire [15:0]                  accel_wr_len [0:NUM_ACCELERATORS-1],
    output wire [NUM_ACCELERATORS-1:0]  accel_wr_valid,
    input  wire [NUM_ACCELERATORS-1:0]  accel_wr_ready,
    // Compliance and status
    output wire                         host_compliant,
    output wire                         rate_limit_active,
    output wire [31:0]                  pending_requests,
    output wire [31:0]                  total_requests,
    output wire [31:0]                  violations
);
// Well-Behaved Host Interface
// Provides abstraction layer for compute accelerators (IPU, GPU, etc.) to ensure
// orderly host behavior, resource management, and proper protocol adherence
module well_behaved_host #(
    parameter ADDR_WIDTH = 64,
    parameter DATA_WIDTH = 512,
    parameter NUM_ACCELERATORS = 4,
    parameter MAX_OUTSTANDING_REQUESTS = 16
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // Host PCIe interface
    input  wire [ADDR_WIDTH-1:0]        host_rd_addr,
    input  wire [10:0]                  host_rd_len,
    input  wire                         host_rd_req,
    output wire                         host_rd_ack,
    output wire [DATA_WIDTH-1:0]        host_rd_data,
    output wire                         host_rd_valid,
    input  wire                         host_rd_ready,
    
    input  wire [ADDR_WIDTH-1:0]        host_wr_addr,
    input  wire [DATA_WIDTH-1:0]        host_wr_data,
    input  wire [15:0]                  host_wr_len,
    input  wire                         host_wr_valid,
    output wire                         host_wr_ready,
    
    // Accelerator interfaces (to IPU, GPU, etc.)
    output wire [ADDR_WIDTH-1:0]        accel_rd_addr [0:NUM_ACCELERATORS-1],
    output wire [10:0]                  accel_rd_len [0:NUM_ACCELERATORS-1],
    output wire [NUM_ACCELERATORS-1:0]  accel_rd_req,
    input  wire [NUM_ACCELERATORS-1:0]  accel_rd_ack,
    input  wire [DATA_WIDTH-1:0]        accel_rd_data [0:NUM_ACCELERATORS-1],
    input  wire [NUM_ACCELERATORS-1:0]  accel_rd_valid,
    output wire [NUM_ACCELERATORS-1:0]  accel_rd_ready,
    
    output wire [ADDR_WIDTH-1:0]        accel_wr_addr [0:NUM_ACCELERATORS-1],
    output wire [DATA_WIDTH-1:0]        accel_wr_data [0:NUM_ACCELERATORS-1],
    output wire [15:0]                  accel_wr_len [0:NUM_ACCELERATORS-1],
    output wire [NUM_ACCELERATORS-1:0]  accel_wr_valid,
    input  wire [NUM_ACCELERATORS-1:0]  accel_wr_ready,
    
    // Control and status registers (MMIO)
    input  wire [31:0]                  mmio_addr,
    input  wire [31:0]                  mmio_wr_data,
    input  wire                         mmio_wr_en,
    input  wire                         mmio_rd_en,
    output reg  [31:0]                  mmio_rd_data,
    output reg                          mmio_rd_valid,
    
    // Resource allocation status
    output wire [NUM_ACCELERATORS-1:0]  accel_allocated,
    output wire [NUM_ACCELERATORS-1:0]  accel_busy,
    output wire [NUM_ACCELERATORS-1:0]  accel_error,
    
    // Well-behaved host status
    output wire                         host_compliant,
    output wire                         rate_limit_active,
    output wire [31:0]                  pending_requests,
    output wire [31:0]                  total_requests,
    output wire [31:0]                  violations
);

    // Register map
    localparam REG_HOST_CONTROL         = 8'h00;
    localparam REG_HOST_STATUS          = 8'h04;
    localparam REG_ACCEL_ALLOC_MASK     = 8'h08;
    localparam REG_ACCEL_BUSY_MASK      = 8'h0C;
    localparam REG_MAX_REQUEST_RATE     = 8'h10;
    localparam REG_PENDING_COUNT        = 8'h14;
    localparam REG_TOTAL_REQUESTS       = 8'h18;
    localparam REG_VIOLATIONS           = 8'h1C;
    localparam REG_TIMEOUT_THRESHOLD    = 8'h20;
    localparam REG_BANDWIDTH_LIMIT      = 8'h24;
    
    // Control register bits
    localparam CTRL_ENABLE              = 0;
    localparam CTRL_RESET_COUNTERS      = 1;
    localparam CTRL_RATE_LIMIT_EN       = 2;
    localparam CTRL_TIMEOUT_EN          = 3;
    localparam CTRL_BANDWIDTH_LIMIT_EN  = 4;
    
    // Status register bits
    localparam STAT_HOST_COMPLIANT      = 0;
    localparam STAT_RATE_LIMIT_ACTIVE   = 1;
    localparam STAT_TIMEOUT_DETECTED    = 2;
    localparam STAT_BANDWIDTH_EXCEEDED  = 3;
    
    // Internal registers
    reg [31:0] control_reg;
    reg [31:0] status_reg;
    reg [31:0] max_request_rate;
    reg [31:0] timeout_threshold;
    reg [31:0] bandwidth_limit_mbps;
    reg [31:0] pending_req_count;
    reg [31:0] total_req_count;
    reg [31:0] violation_count;
    
    // Request tracking
    reg [15:0] request_timestamps [0:MAX_OUTSTANDING_REQUESTS-1];
    reg [MAX_OUTSTANDING_REQUESTS-1:0] request_valid;
    reg [4:0] oldest_request_idx;
    
    // Rate limiting
    reg [31:0] request_window_count;
    reg [31:0] window_timer;
    wire rate_limit_exceeded;
    
    // Bandwidth tracking
    reg [31:0] bytes_transferred_window;
    reg [31:0] bandwidth_timer;
    wire bandwidth_exceeded;
    
    // Timeout detection
    reg [15:0] timeout_timer;
    wire timeout_detected;
    
    // Resource allocation tracking
    reg [NUM_ACCELERATORS-1:0] allocation_mask;
    reg [NUM_ACCELERATORS-1:0] busy_mask;
    reg [NUM_ACCELERATORS-1:0] error_mask;
    
    // Request arbitration
    reg [1:0] current_accel_idx;
    wire host_enable;
    
    assign host_enable = control_reg[CTRL_ENABLE];
    assign rate_limit_exceeded = (request_window_count >= max_request_rate) && 
                                  control_reg[CTRL_RATE_LIMIT_EN];
    assign bandwidth_exceeded = (bytes_transferred_window >= (bandwidth_limit_mbps << 20)) && 
                                control_reg[CTRL_BANDWIDTH_LIMIT_EN];
    assign timeout_detected = (timeout_timer >= timeout_threshold[15:0]) && 
                              control_reg[CTRL_TIMEOUT_EN] && 
                              (pending_req_count > 0);
    
    // Status outputs
    assign host_compliant = status_reg[STAT_HOST_COMPLIANT];
    assign rate_limit_active = status_reg[STAT_RATE_LIMIT_ACTIVE];
    assign pending_requests = pending_req_count;
    assign total_requests = total_req_count;
    assign violations = violation_count;
    
    assign accel_allocated = allocation_mask;
    assign accel_busy = busy_mask;
    assign accel_error = error_mask;
    
    // Host read/write acknowledgment logic
    assign host_rd_ack = host_rd_req && host_enable && !rate_limit_exceeded && 
                         (pending_req_count < MAX_OUTSTANDING_REQUESTS);
    assign host_wr_ready = host_enable && !rate_limit_exceeded && !bandwidth_exceeded;
    
    // Accelerator interface routing (round-robin)
    genvar i;
    generate
        for (i = 0; i < NUM_ACCELERATORS; i = i + 1) begin : gen_accel_routing
            assign accel_rd_addr[i] = host_rd_addr;
            assign accel_rd_len[i] = host_rd_len;
            assign accel_rd_req[i] = (i == current_accel_idx) && host_rd_ack;
            
            assign accel_wr_addr[i] = host_wr_addr;
            assign accel_wr_data[i] = host_wr_data;
            assign accel_wr_len[i] = host_wr_len;
            assign accel_wr_valid[i] = (i == current_accel_idx) && host_wr_valid && host_wr_ready;
            
            assign accel_rd_ready[i] = host_rd_ready;
        end
    endgenerate
    
    // Return data from selected accelerator
    assign host_rd_data = accel_rd_data[current_accel_idx];
    assign host_rd_valid = accel_rd_valid[current_accel_idx];
    
    // MMIO register access
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            mmio_rd_data <= 32'd0;
            mmio_rd_valid <= 1'b0;
        end else begin
            mmio_rd_valid <= mmio_rd_en;
            
            if (mmio_rd_en) begin
                case (mmio_addr[7:0])
                    REG_HOST_CONTROL:       mmio_rd_data <= control_reg;
                    REG_HOST_STATUS:        mmio_rd_data <= status_reg;
                    REG_ACCEL_ALLOC_MASK:   mmio_rd_data <= {{(32-NUM_ACCELERATORS){1'b0}}, allocation_mask};
                    REG_ACCEL_BUSY_MASK:    mmio_rd_data <= {{(32-NUM_ACCELERATORS){1'b0}}, busy_mask};
                    REG_MAX_REQUEST_RATE:   mmio_rd_data <= max_request_rate;
                    REG_PENDING_COUNT:      mmio_rd_data <= pending_req_count;
                    REG_TOTAL_REQUESTS:     mmio_rd_data <= total_req_count;
                    REG_VIOLATIONS:         mmio_rd_data <= violation_count;
                    REG_TIMEOUT_THRESHOLD:  mmio_rd_data <= timeout_threshold;
                    REG_BANDWIDTH_LIMIT:    mmio_rd_data <= bandwidth_limit_mbps;
                    default:                mmio_rd_data <= 32'd0;
                endcase
            end
        end
    end
    
    // MMIO register writes
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            control_reg <= 32'd0;
            max_request_rate <= 32'd100;  // Default: 100 requests per window
            timeout_threshold <= 32'd10000;  // Default: 10000 cycles
            bandwidth_limit_mbps <= 32'd1000;  // Default: 1000 MB/s
        end else begin
            if (mmio_wr_en) begin
                case (mmio_addr[7:0])
                    REG_HOST_CONTROL: begin
                        control_reg <= mmio_wr_data;
                        if (mmio_wr_data[CTRL_RESET_COUNTERS]) begin
                            // Self-clearing bit
                            control_reg[CTRL_RESET_COUNTERS] <= 1'b0;
                        end
                    end
                    REG_MAX_REQUEST_RATE:   max_request_rate <= mmio_wr_data;
                    REG_TIMEOUT_THRESHOLD:  timeout_threshold <= mmio_wr_data;
                    REG_BANDWIDTH_LIMIT:    bandwidth_limit_mbps <= mmio_wr_data;
                    REG_ACCEL_ALLOC_MASK:   allocation_mask <= mmio_wr_data[NUM_ACCELERATORS-1:0];
                endcase
            end
        end
    end
    
    // Request tracking and timeout detection
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            pending_req_count <= 32'd0;
            total_req_count <= 32'd0;
            violation_count <= 32'd0;
            timeout_timer <= 16'd0;
            request_valid <= {MAX_OUTSTANDING_REQUESTS{1'b0}};
        end else begin
            if (control_reg[CTRL_RESET_COUNTERS]) begin
                total_req_count <= 32'd0;
                violation_count <= 32'd0;
            end else begin
                // Track new requests
                if (host_rd_ack) begin
                    pending_req_count <= pending_req_count + 1'b1;
                    total_req_count <= total_req_count + 1'b1;
                end
                
                // Track completions
                if (host_rd_valid && host_rd_ready) begin
                    if (pending_req_count > 0)
                        pending_req_count <= pending_req_count - 1'b1;
                end
                
                // Timeout detection
                if (pending_req_count > 0) begin
                    timeout_timer <= timeout_timer + 1'b1;
                    if (timeout_detected) begin
                        violation_count <= violation_count + 1'b1;
                        timeout_timer <= 16'd0;
                    end
                end else begin
                    timeout_timer <= 16'd0;
                end
                
                // Rate limit violations
                if (host_rd_req && rate_limit_exceeded) begin
                    violation_count <= violation_count + 1'b1;
                end
            end
        end
    end
    
    // Rate limiting window (1ms window @ 250MHz = 250000 cycles)
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            request_window_count <= 32'd0;
            window_timer <= 32'd0;
        end else begin
            if (window_timer >= 32'd250000) begin
                window_timer <= 32'd0;
                request_window_count <= 32'd0;
            end else begin
                window_timer <= window_timer + 1'b1;
                if (host_rd_ack) begin
                    request_window_count <= request_window_count + 1'b1;
                end
            end
        end
    end
    
    // Bandwidth tracking window
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            bytes_transferred_window <= 32'd0;
            bandwidth_timer <= 32'd0;
        end else begin
            if (bandwidth_timer >= 32'd250000000) begin  // 1 second window
                bandwidth_timer <= 32'd0;
                bytes_transferred_window <= 32'd0;
            end else begin
                bandwidth_timer <= bandwidth_timer + 1'b1;
                if (host_wr_valid && host_wr_ready) begin
                    bytes_transferred_window <= bytes_transferred_window + (host_wr_len << 6);
                end
            end
        end
    end
    
    // Status register updates
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            status_reg <= 32'd0;
        end else begin
            status_reg[STAT_HOST_COMPLIANT] <= !timeout_detected && !rate_limit_exceeded && !bandwidth_exceeded;
            status_reg[STAT_RATE_LIMIT_ACTIVE] <= rate_limit_exceeded;
            status_reg[STAT_TIMEOUT_DETECTED] <= timeout_detected;
            status_reg[STAT_BANDWIDTH_EXCEEDED] <= bandwidth_exceeded;
        end
    end
    
    // Accelerator busy/error tracking
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            busy_mask <= {NUM_ACCELERATORS{1'b0}};
            error_mask <= {NUM_ACCELERATORS{1'b0}};
        end else begin
            // Update busy status from accelerator interfaces
            busy_mask <= accel_rd_req | accel_wr_valid;
            
            // Error detection (simplified - could be enhanced)
            // Set error if request not acknowledged within reasonable time
        end
    end
    
    // Round-robin accelerator selection
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            current_accel_idx <= 2'd0;
        end else begin
            if (host_rd_ack || (host_wr_valid && host_wr_ready)) begin
                if (current_accel_idx == NUM_ACCELERATORS - 1)
                    current_accel_idx <= 2'd0;
                else
                    current_accel_idx <= current_accel_idx + 1'b1;
            end
        end
    end

endmodule
endmodule
```
