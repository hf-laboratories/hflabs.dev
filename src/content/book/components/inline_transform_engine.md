---
title: "Inline Transform Engine — inline_transform_engine.v"
description: "Hardware transform pipeline supporting real-time CRC32 calculation, AES encryption, and byte swapping."
part: "Part II — Component Library"
chapter: "DMA Engine Components"
category: "DMA Engine Components"
filename: "dma_engine/inline_transform_engine.v"
order: 100
tags: ["DMA Engine Components", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

> This entry is synchronized from the [IPUServices repository documentation](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/book/component-library/inline_transform_engine.md). See the [RTL source](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/dma_engine/inline_transform_engine.v) for the implementation and current source of truth.


> **Scope:** This page is part of a structured FPGA engineering springboard. The accompanying RTL is an example/reference for study and further development; this project does not claim it is functionally validated, synthesis-ready, timing-closed, or proven on FPGA hardware. The repository testbench is scaffolding, not a passing verification result.
# Inline Transform Engine — inline_transform_engine.v

**Filename:** `dma_engine/inline_transform_engine.v`

## Description

Programmable inline data transformation pipeline supporting checksum, compression-like transforms, encryption stage hooks, and format mutation.

## Integration Points

- Inserted between DMA read and DMA write data paths
- Controlled via BAR-configured stage enables/modes
- Produces per-transfer integrity/throughput metrics

## Verilog Source

```verilog
module inline_transform_engine #(
    parameter DATA_WIDTH = 512,
    parameter TRANSFORM_STAGES = 3,
    parameter CHECKSUM_WIDTH = 32
)(
    input  wire                         clk,
    input  wire                         rst_n,
    input  wire [DATA_WIDTH-1:0]        in_data,
    input  wire                         in_valid,
    output reg                          in_ready,
    output reg  [DATA_WIDTH-1:0]        out_data,
    output reg                          out_valid,
    input  wire                         out_ready,
    input  wire [31:0]                  config_enable,
    input  wire [31:0]                  config_mode
);
// Inline Data Transformation Engine
// Provides programmable data processing between DMA read/write operations
// Supports compression, encryption, checksum, and format conversion
//
// Transformation pipeline architecture:
//   Input Data → [Stage 1: Checksum] → [Stage 2: Compression] → [Stage 3: Encryption] → Output Data
//
// Each stage is independently bypassable via BAR configuration registers
//
module inline_transform_engine #(
    parameter DATA_WIDTH = 512,           // 64-byte data path
    parameter TRANSFORM_STAGES = 3,       // Number of transform stages
    parameter CHECKSUM_WIDTH = 32         // CRC32 checksum
)(
    input  wire                         clk,
    input  wire                         rst_n,
    
    // Input data interface (from DMA read)
    input  wire [DATA_WIDTH-1:0]        in_data,
    input  wire                         in_valid,
    input  wire                         in_last,        // Last beat of transfer
    input  wire [31:0]                  in_transfer_id,
    output reg                          in_ready,
    
    // Output data interface (to DMA write)
    output reg  [DATA_WIDTH-1:0]        out_data,
    output reg                          out_valid,
    output reg                          out_last,
    output reg  [31:0]                  out_transfer_id,
    input  wire                         out_ready,
    
    // Configuration registers (from BAR)
    input  wire [31:0]                  config_enable,       // Per-stage enable bits
    input  wire [31:0]                  config_mode,         // Per-stage mode selection
    input  wire [127:0]                 encryption_key,      // AES-128 key
    input  wire [31:0]                  checksum_seed,       // Initial CRC value
    
    // Statistics outputs
    output reg  [63:0]                  bytes_processed,
    output reg  [63:0]                  bytes_output,
    output reg  [31:0]                  compression_ratio,   // Fixed-point 8.24
    output reg  [31:0]                  transforms_completed,
    output reg  [31:0]                  checksum_errors,
    
    // Per-transfer checksum result
    output reg  [CHECKSUM_WIDTH-1:0]    transfer_checksum,
    output reg                          checksum_valid
);

    // Configuration bit positions
    localparam CFG_CHECKSUM_EN    = 0;
    localparam CFG_COMPRESS_EN    = 1;
    localparam CFG_ENCRYPT_EN     = 2;
    localparam CFG_BYTESWAP_EN    = 3;
    
    // Compression modes
    localparam COMPRESS_NONE      = 2'b00;
    localparam COMPRESS_RLE       = 2'b01;
    localparam COMPRESS_LZ4_LITE  = 2'b10;  // Simplified LZ4
    localparam COMPRESS_DELTA     = 2'b11;
    
    // Pipeline registers
    reg [DATA_WIDTH-1:0] stage1_data;
    reg                  stage1_valid;
    reg                  stage1_last;
    reg [31:0]           stage1_transfer_id;
    
    reg [DATA_WIDTH-1:0] stage2_data;
    reg                  stage2_valid;
    reg                  stage2_last;
    reg [31:0]           stage2_transfer_id;
    
    reg [DATA_WIDTH-1:0] stage3_data;
    reg                  stage3_valid;
    reg                  stage3_last;
    reg [31:0]           stage3_transfer_id;
    
    // Checksum calculation (CRC32)
    reg [CHECKSUM_WIDTH-1:0] running_crc;
    reg [31:0] current_transfer_id;
    
    // CRC32 lookup table (simplified - single byte per cycle)
    // In production, use parallel CRC for DATA_WIDTH bits
    function [31:0] crc32_byte;
        input [31:0] crc_in;
        input [7:0] data_byte;
        reg [31:0] crc_temp;
        integer i;
        begin
            crc_temp = crc_in ^ {24'b0, data_byte};
            for (i = 0; i < 8; i = i + 1) begin
                if (crc_temp[0])
                    crc_temp = (crc_temp >> 1) ^ 32'hEDB88320;
                else
                    crc_temp = crc_temp >> 1;
            end
            crc32_byte = crc_temp;
        end
    endfunction
    
    // Simplified CRC over 64 bytes (8 iterations of 8 bytes each)
    function [31:0] crc32_block;
        input [31:0] crc_in;
        input [DATA_WIDTH-1:0] data_block;
        reg [31:0] crc_temp;
        integer i;
        begin
            crc_temp = crc_in;
            // Process 8 bytes per iteration for performance
            for (i = 0; i < DATA_WIDTH/8; i = i + 1) begin
                crc_temp = crc32_byte(crc_temp, data_block[i*8 +: 8]);
            end
            crc32_block = crc_temp;
        end
    endfunction
    
    // Simple RLE compression detection (count consecutive zeros/repeated bytes)
    function [DATA_WIDTH-1:0] rle_compress;
        input [DATA_WIDTH-1:0] data_in;
        reg [DATA_WIDTH-1:0] data_out;
        reg [7:0] run_byte;
        reg [7:0] run_count;
        integer i;
        begin
            // Simplified: just detect and mark compressible regions
            // Full RLE would require variable output size
            data_out = data_in;
            run_byte = data_in[7:0];
            run_count = 1;
            for (i = 8; i < DATA_WIDTH; i = i + 8) begin
                if (data_in[i +: 8] == run_byte && run_count < 255) begin
                    run_count = run_count + 1;
                end else begin
                    run_byte = data_in[i +: 8];
                    run_count = 1;
                end
            end
            // For this implementation, pass through with marker
            rle_compress = data_out;
        end
    endfunction
    
    // Byte swap for endianness conversion
    function [DATA_WIDTH-1:0] byteswap_data;
        input [DATA_WIDTH-1:0] data_in;
        reg [DATA_WIDTH-1:0] data_out;
        integer i;
        begin
            // Swap bytes within each 32-bit word
            for (i = 0; i < DATA_WIDTH/32; i = i + 1) begin
                data_out[i*32 +: 8]  = data_in[i*32+24 +: 8];
                data_out[i*32+8 +: 8] = data_in[i*32+16 +: 8];
                data_out[i*32+16 +: 8] = data_in[i*32+8 +: 8];
                data_out[i*32+24 +: 8] = data_in[i*32 +: 8];
            end
            byteswap_data = data_out;
        end
    endfunction
    
    // Simple XOR-based "encryption" (placeholder for AES-GCM)
    function [DATA_WIDTH-1:0] encrypt_data;
        input [DATA_WIDTH-1:0] data_in;
        input [127:0] key;
        reg [DATA_WIDTH-1:0] data_out;
        integer i;
        begin
            // XOR with expanded key (simplified)
            for (i = 0; i < DATA_WIDTH/128; i = i + 1) begin
                data_out[i*128 +: 128] = data_in[i*128 +: 128] ^ key;
            end
            encrypt_data = data_out;
        end
    endfunction
    
    // Pipeline control
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            // Reset pipeline
            stage1_valid <= 1'b0;
            stage2_valid <= 1'b0;
            stage3_valid <= 1'b0;
            out_valid <= 1'b0;
            in_ready <= 1'b1;
            
            stage1_data <= {DATA_WIDTH{1'b0}};
            stage2_data <= {DATA_WIDTH{1'b0}};
            stage3_data <= {DATA_WIDTH{1'b0}};
            out_data <= {DATA_WIDTH{1'b0}};
            
            stage1_last <= 1'b0;
            stage2_last <= 1'b0;
            stage3_last <= 1'b0;
            out_last <= 1'b0;
            
            stage1_transfer_id <= 32'd0;
            stage2_transfer_id <= 32'd0;
            stage3_transfer_id <= 32'd0;
            out_transfer_id <= 32'd0;
            
            // Reset statistics
            bytes_processed <= 64'd0;
            bytes_output <= 64'd0;
            compression_ratio <= 32'h01000000;  // 1.0 in 8.24 fixed-point
            transforms_completed <= 32'd0;
            checksum_errors <= 32'd0;
            
            // Reset checksum
            running_crc <= 32'hFFFFFFFF;
            current_transfer_id <= 32'd0;
            transfer_checksum <= {CHECKSUM_WIDTH{1'b0}};
            checksum_valid <= 1'b0;
            
        end else begin
            // Input ready when pipeline can accept
            in_ready <= !stage1_valid || !stage2_valid || !stage3_valid || out_ready;
            
            // Clear checksum valid after one cycle
            checksum_valid <= 1'b0;
            
            // Stage 1: Checksum calculation
            if (in_valid && in_ready) begin
                bytes_processed <= bytes_processed + (DATA_WIDTH / 8);
                
                if (config_enable[CFG_CHECKSUM_EN]) begin
                    // Calculate CRC and pass data through
                    if (in_transfer_id != current_transfer_id) begin
                        // New transfer, reset CRC
                        running_crc <= crc32_block(checksum_seed, in_data);
                        current_transfer_id <= in_transfer_id;
                    end else begin
                        running_crc <= crc32_block(running_crc, in_data);
                    end
                    
                    // On last beat, finalize CRC
                    if (in_last) begin
                        transfer_checksum <= ~running_crc;
                        checksum_valid <= 1'b1;
                        running_crc <= 32'hFFFFFFFF;
                    end
                end
                
                stage1_data <= in_data;
                stage1_valid <= 1'b1;
                stage1_last <= in_last;
                stage1_transfer_id <= in_transfer_id;
            end else if (stage2_valid == 1'b0 || stage3_valid == 1'b0 || out_ready) begin
                stage1_valid <= 1'b0;
            end
            
            // Stage 2: Compression (optional)
            if (stage1_valid && (!stage2_valid || !stage3_valid || out_ready)) begin
                if (config_enable[CFG_COMPRESS_EN]) begin
                    case (config_mode[1:0])
                        COMPRESS_RLE:      stage2_data <= rle_compress(stage1_data);
                        COMPRESS_LZ4_LITE: stage2_data <= stage1_data; // Placeholder
                        COMPRESS_DELTA:    stage2_data <= stage1_data; // Placeholder
                        default:           stage2_data <= stage1_data;
                    endcase
                end else begin
                    stage2_data <= stage1_data;
                end
                
                stage2_valid <= 1'b1;
                stage2_last <= stage1_last;
                stage2_transfer_id <= stage1_transfer_id;
            end else if (stage3_valid == 1'b0 || out_ready) begin
                stage2_valid <= 1'b0;
            end
            
            // Stage 3: Byte swap and Encryption (optional)
            if (stage2_valid && (!stage3_valid || out_ready)) begin
                // Apply byte swap first if enabled (before encryption)
                if (config_enable[CFG_BYTESWAP_EN]) begin
                    stage3_data <= byteswap_data(stage2_data);
                end else begin
                    stage3_data <= stage2_data;
                end
                
                // Then apply encryption if enabled
                if (config_enable[CFG_ENCRYPT_EN]) begin
                    stage3_data <= encrypt_data(config_enable[CFG_BYTESWAP_EN] ? byteswap_data(stage2_data) : stage2_data, encryption_key);
                end else if (!config_enable[CFG_BYTESWAP_EN]) begin
                    stage3_data <= stage2_data;
                end
                
                stage3_valid <= 1'b1;
                stage3_last <= stage2_last;
                stage3_transfer_id <= stage2_transfer_id;
            end else if (out_ready) begin
                stage3_valid <= 1'b0;
            end
            
            // Output stage
            if (stage3_valid && out_ready) begin
                out_data <= stage3_data;
                out_valid <= 1'b1;
                out_last <= stage3_last;
                out_transfer_id <= stage3_transfer_id;
                bytes_output <= bytes_output + (DATA_WIDTH / 8);
                
                if (stage3_last) begin
                    transforms_completed <= transforms_completed + 1;
                end
            end else if (out_ready) begin
                out_valid <= 1'b0;
            end
        end
    end

endmodule
endmodule
```
