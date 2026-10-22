---
title: "PCIe BAR Registers (PTP) — pcie_bar_registers.sv"
description: "Memory-mapped BAR0 register bank exposing PHC time, drift offsets, GPS locking status, and controls."
part: "Part II — Component Library"
chapter: "Timing & PTPv2 Components"
category: "Timing & PTPv2 Components"
filename: "timing/pcie_bar_registers.sv"
order: 100
tags: ["Timing & PTPv2 Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/pcie_bar_registers.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/timing/pcie_bar_registers.sv) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# PCIe BAR Registers (PTP) — pcie_bar_registers.sv

**Filename:** `timing/pcie_bar_registers.sv`

## Description

Memory-mapped BAR register block for PTP grandmaster control/status, including PHC adjustment controls, GPS state visibility, discipline tuning, and holdover configuration.

## Integration Points

- Host-software-facing control plane for timing subsystem
- CDC-synchronized bridge from PHC/GPS/discipline domains into PCIe BAR domain
- Feeds configuration knobs to PHC adjustment and discipline loops

## Verilog Source

```verilog
module pcie_bar_registers #(
    parameter PHC_WIDTH = 80,
    parameter DAC_WIDTH = 16
)(
    input  wire clk,
    input  wire rst_n,
    input  wire [15:0] bar_address,
    input  wire bar_read,
    output reg  [31:0] bar_readdata,
    input  wire bar_write,
    input  wire [31:0] bar_writedata,
    output reg  signed [31:0] freq_adj_ppb,
    output reg  [31:0] discipline_kp,
    output reg  [31:0] discipline_ki
);
// PCIe BAR Register Map for PTP Grandmaster
// Memory-mapped register interface at BAR0 offset 0x1000-0x1FFF
// Provides configuration and status access for PTP hardware

module pcie_bar_registers #(
    parameter PHC_WIDTH = 80,
    parameter DAC_WIDTH = 16
)(
    input  wire                     clk,
    input  wire                     rst_n,
    
    // PCIe BAR interface (Avalon-MM compatible)
    input  wire [15:0]              bar_address,
    input  wire                     bar_read,
    output reg  [31:0]              bar_readdata,
    output reg                      bar_readdatavalid,
    input  wire                     bar_write,
    input  wire [31:0]              bar_writedata,
    input  wire [3:0]               bar_byteenable,
    output wire                     bar_waitrequest,
    
    // PHC interface (from PHC clock domain)
    input  wire [47:0]              phc_seconds,
    input  wire [31:0]              phc_nanoseconds,
    
    // PHC adjustment outputs
    output reg  [47:0]              adj_seconds,
    output reg  [31:0]              adj_nanoseconds,
    output reg                      adj_add,
    output reg                      adj_trigger,
    output reg  signed [31:0]       freq_adj_ppb,
    output reg                      freq_adj_valid,
    
    // GPS status (from GPS clock domain)
    input  wire                     gps_locked,
    input  wire [7:0]               gps_satellites,
    
    // GPS configuration outputs
    output reg                      survey_mode_enable,
    output reg  [31:0]              survey_duration_sec,
    
    // Discipline loop status (from discipline loop)
    input  wire                     discipline_locked,
    input  wire signed [31:0]       phase_error_ns,
    
    // Discipline loop configuration
    output reg  [31:0]              discipline_kp,
    output reg  [31:0]              discipline_ki,
    output reg                      holdover_enable
);

    // Register map (offsets from 0x1000)
    localparam REG_PTP_VERSION      = 16'h1000;
    localparam REG_PTP_CAPABILITIES = 16'h1004;
    localparam REG_PTP_STATUS       = 16'h1008;
    localparam REG_PHC_SEC_HI       = 16'h1010;
    localparam REG_PHC_SEC_LO       = 16'h1014;
    localparam REG_PHC_NSEC         = 16'h1018;
    localparam REG_PHC_ADJ_SEC      = 16'h1020;
    localparam REG_PHC_ADJ_NSEC     = 16'h1024;
    localparam REG_PHC_ADJ_FREQ     = 16'h1028;
    localparam REG_PHC_ADJ_TRIGGER  = 16'h102C;
    localparam REG_GPS_STATUS       = 16'h1030;
    localparam REG_GPS_SATELLITES   = 16'h1034;
    localparam REG_GPS_SURVEY_CFG   = 16'h1038;
    localparam REG_GPS_SURVEY_DUR   = 16'h103C;
    localparam REG_DISCIPLINE_STATUS = 16'h1040;
    localparam REG_DISCIPLINE_ERROR  = 16'h1044;
    localparam REG_DISCIPLINE_KP     = 16'h1048;
    localparam REG_DISCIPLINE_KI     = 16'h104C;
    localparam REG_HOLDOVER_CFG      = 16'h1050;
    
    // Version and capabilities
    localparam VERSION_ID = 32'h0100_0000;  // Version 1.0.0.0
    localparam CAPABILITIES = 32'h0000_001F;  // All features enabled
    
    // Synchronize status signals from other clock domains
    wire gps_locked_sync;
    wire [7:0] gps_satellites_sync;
    wire discipline_locked_sync;
    wire signed [31:0] phase_error_ns_sync;
    
    cdc_sync #(
        .WIDTH(1),
        .STAGES(3)
    ) u_gps_locked_sync (
        .dst_clk(clk),
        .dst_rst_n(rst_n),
        .src_data(gps_locked),
        .dst_data(gps_locked_sync)
    );
    
    cdc_sync #(
        .WIDTH(8),
        .STAGES(3)
    ) u_gps_satellites_sync (
        .dst_clk(clk),
        .dst_rst_n(rst_n),
        .src_data(gps_satellites),
        .dst_data(gps_satellites_sync)
    );
    
    cdc_sync #(
        .WIDTH(1),
        .STAGES(3)
    ) u_discipline_locked_sync (
        .dst_clk(clk),
        .dst_rst_n(rst_n),
        .src_data(discipline_locked),
        .dst_data(discipline_locked_sync)
    );
    
    cdc_sync #(
        .WIDTH(32),
        .STAGES(3)
    ) u_phase_error_sync (
        .dst_clk(clk),
        .dst_rst_n(rst_n),
        .src_data(phase_error_ns),
        .dst_data(phase_error_ns_sync)
    );
    
    // Synchronize PHC timestamp (atomic read)
    reg [47:0] phc_seconds_sync;
    reg [31:0] phc_nanoseconds_sync;
    reg [47:0] phc_seconds_latched;
    reg [31:0] phc_nanoseconds_latched;
    reg phc_latched_valid;
    
    cdc_sync #(
        .WIDTH(48),
        .STAGES(3)
    ) u_phc_seconds_sync (
        .dst_clk(clk),
        .dst_rst_n(rst_n),
        .src_data(phc_seconds),
        .dst_data(phc_seconds_sync)
    );
    
    cdc_sync #(
        .WIDTH(32),
        .STAGES(3)
    ) u_phc_nanoseconds_sync (
        .dst_clk(clk),
        .dst_rst_n(rst_n),
        .src_data(phc_nanoseconds),
        .dst_data(phc_nanoseconds_sync)
    );
    
    // No wait states
    assign bar_waitrequest = 1'b0;
    
    // Write handling
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            adj_seconds <= 48'h0;
            adj_nanoseconds <= 32'h0;
            adj_add <= 1'b0;
            adj_trigger <= 1'b0;
            freq_adj_ppb <= 32'h0;
            freq_adj_valid <= 1'b0;
            survey_mode_enable <= 1'b0;
            survey_duration_sec <= 32'd3600;  // Default 1 hour
            discipline_kp <= 32'h0000_0FA0;  // Default Kp = 0.000061
            discipline_ki <= 32'h0000_0107;  // Default Ki = 0.000004
            holdover_enable <= 1'b1;  // Default enabled
        end else begin
            // Clear single-cycle signals
            adj_trigger <= 1'b0;
            freq_adj_valid <= 1'b0;
            
            if (bar_write) begin
                case (bar_address)
                    REG_PHC_ADJ_SEC: begin
                        if (bar_byteenable[3]) adj_seconds[47:40] <= bar_writedata[31:24];
                        if (bar_byteenable[2]) adj_seconds[39:32] <= bar_writedata[23:16];
                        if (bar_byteenable[1]) adj_seconds[31:24] <= bar_writedata[15:8];
                        if (bar_byteenable[0]) adj_seconds[23:16] <= bar_writedata[7:0];
                    end
                    
                    REG_PHC_ADJ_NSEC: begin
                        if (bar_byteenable[3]) adj_nanoseconds[31:24] <= bar_writedata[31:24];
                        if (bar_byteenable[2]) adj_nanoseconds[23:16] <= bar_writedata[23:16];
                        if (bar_byteenable[1]) adj_nanoseconds[15:8] <= bar_writedata[15:8];
                        if (bar_byteenable[0]) adj_nanoseconds[7:0] <= bar_writedata[7:0];
                    end
                    
                    REG_PHC_ADJ_FREQ: begin
                        if (bar_byteenable[3]) freq_adj_ppb[31:24] <= bar_writedata[31:24];
                        if (bar_byteenable[2]) freq_adj_ppb[23:16] <= bar_writedata[23:16];
                        if (bar_byteenable[1]) freq_adj_ppb[15:8] <= bar_writedata[15:8];
                        if (bar_byteenable[0]) freq_adj_ppb[7:0] <= bar_writedata[7:0];
                        freq_adj_valid <= 1'b1;
                    end
                    
                    REG_PHC_ADJ_TRIGGER: begin
                        adj_add <= bar_writedata[0];
                        adj_trigger <= bar_writedata[1];
                    end
                    
                    REG_GPS_SURVEY_CFG: begin
                        if (bar_byteenable[0]) survey_mode_enable <= bar_writedata[0];
                    end
                    
                    REG_GPS_SURVEY_DUR: begin
                        if (bar_byteenable[3]) survey_duration_sec[31:24] <= bar_writedata[31:24];
                        if (bar_byteenable[2]) survey_duration_sec[23:16] <= bar_writedata[23:16];
                        if (bar_byteenable[1]) survey_duration_sec[15:8] <= bar_writedata[15:8];
                        if (bar_byteenable[0]) survey_duration_sec[7:0] <= bar_writedata[7:0];
                    end
                    
                    REG_DISCIPLINE_KP: begin
                        if (bar_byteenable[3]) discipline_kp[31:24] <= bar_writedata[31:24];
                        if (bar_byteenable[2]) discipline_kp[23:16] <= bar_writedata[23:16];
                        if (bar_byteenable[1]) discipline_kp[15:8] <= bar_writedata[15:8];
                        if (bar_byteenable[0]) discipline_kp[7:0] <= bar_writedata[7:0];
                    end
                    
                    REG_DISCIPLINE_KI: begin
                        if (bar_byteenable[3]) discipline_ki[31:24] <= bar_writedata[31:24];
                        if (bar_byteenable[2]) discipline_ki[23:16] <= bar_writedata[23:16];
                        if (bar_byteenable[1]) discipline_ki[15:8] <= bar_writedata[15:8];
                        if (bar_byteenable[0]) discipline_ki[7:0] <= bar_writedata[7:0];
                    end
                    
                    REG_HOLDOVER_CFG: begin
                        if (bar_byteenable[0]) holdover_enable <= bar_writedata[0];
                    end
                endcase
            end
        end
    end
    
    // Read handling with atomic PHC timestamp latch
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            bar_readdata <= 32'h0;
            bar_readdatavalid <= 1'b0;
            phc_seconds_latched <= 48'h0;
            phc_nanoseconds_latched <= 32'h0;
            phc_latched_valid <= 1'b0;
        end else begin
            bar_readdatavalid <= 1'b0;
            
            if (bar_read) begin
                bar_readdatavalid <= 1'b1;
                
                case (bar_address)
                    REG_PTP_VERSION: begin
                        bar_readdata <= VERSION_ID;
                    end
                    
                    REG_PTP_CAPABILITIES: begin
                        bar_readdata <= CAPABILITIES;
                    end
                    
                    REG_PTP_STATUS: begin
                        bar_readdata <= {
                            30'h0,
                            discipline_locked_sync,
                            gps_locked_sync
                        };
                    end
                    
                    REG_PHC_SEC_HI: begin
                        // Atomic latch on first read of timestamp sequence
                        phc_seconds_latched <= phc_seconds_sync;
                        phc_nanoseconds_latched <= phc_nanoseconds_sync;
                        phc_latched_valid <= 1'b1;
                        bar_readdata <= {16'h0, phc_seconds_sync[47:32]};
                    end
                    
                    REG_PHC_SEC_LO: begin
                        if (phc_latched_valid) begin
                            bar_readdata <= phc_seconds_latched[31:0];
                        end else begin
                            bar_readdata <= phc_seconds_sync[31:0];
                        end
                    end
                    
                    REG_PHC_NSEC: begin
                        if (phc_latched_valid) begin
                            bar_readdata <= phc_nanoseconds_latched;
                        end else begin
                            bar_readdata <= phc_nanoseconds_sync;
                        end
                        phc_latched_valid <= 1'b0;  // Clear after complete read
                    end
                    
                    REG_GPS_STATUS: begin
                        bar_readdata <= {31'h0, gps_locked_sync};
                    end
                    
                    REG_GPS_SATELLITES: begin
                        bar_readdata <= {24'h0, gps_satellites_sync};
                    end
                    
                    REG_GPS_SURVEY_CFG: begin
                        bar_readdata <= {31'h0, survey_mode_enable};
                    end
                    
                    REG_GPS_SURVEY_DUR: begin
                        bar_readdata <= survey_duration_sec;
                    end
                    
                    REG_DISCIPLINE_STATUS: begin
                        bar_readdata <= {31'h0, discipline_locked_sync};
                    end
                    
                    REG_DISCIPLINE_ERROR: begin
                        bar_readdata <= phase_error_ns_sync;
                    end
                    
                    REG_DISCIPLINE_KP: begin
                        bar_readdata <= discipline_kp;
                    end
                    
                    REG_DISCIPLINE_KI: begin
                        bar_readdata <= discipline_ki;
                    end
                    
                    REG_HOLDOVER_CFG: begin
                        bar_readdata <= {31'h0, holdover_enable};
                    end
                    
                    default: begin
                        bar_readdata <= 32'hDEAD_BEEF;
                    end
                endcase
            end
        end
    end

endmodule
endmodule
```
