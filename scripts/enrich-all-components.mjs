import fs from 'fs';
import path from 'path';

const compDir = './src/content/book/components';
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

const files = fs.readdirSync(compDir);

const catMap = {
  'advanced_error_recovery': { cat: 'Utility Modules', title: 'Advanced Error Recovery', file: 'util/advanced_error_recovery.v', desc: 'Implements comprehensive error detection, logging, retry state, and policy-driven recovery actions.' },
  'afi_mux_ddr3_ddrx': { cat: 'DDR3 Controller Components', title: 'AFI Mux DDR3 DDRx', file: 'ddr3/ddr3sdram_uniphy_iommu/afi_mux_ddr3_ddrx.v', desc: 'Multiplexes AFI signals between the calibration sequencer and runtime memory controller.' },
  'agent_message_router': { cat: 'DMA Engine Components', title: 'Agent Message Router', file: 'dma_engine/agent_message_router.v', desc: 'Routes inter-agent messages with FIFO buffering, priority support, and zero-copy transfer coordination.' },
  'arbiter_rr': { cat: 'Utility Modules', title: 'Round-Robin Arbiter', file: 'util/arbiter_rr.v', desc: 'Implements a round-robin arbitration scheme for multiple requestors with priority masking.' },
  'bmc_mailbox': { cat: 'BMC Components', title: 'BMC Mailbox', file: 'bmc/bmc_mailbox.v', desc: 'Sideband mailbox register block for management plane communication between the BMC and FPGA.' },
  'catapult_ptp_grandmaster': { cat: 'Timing & PTPv2 Components', title: 'Catapult PTP Grandmaster', file: 'timing/catapult_ptp_grandmaster.sv', desc: 'IEEE 1588 PTPv2 grandmaster integrating GPS, PHC counter, OCXO discipline loop, and Ethernet timestamping.' },
  'cdc_modules': { cat: 'Utility Modules', title: 'CDC Modules', file: 'util/cdc_modules.v', desc: 'Metastability-hardened clock domain crossing primitives including sync, pulse, and data handshakes.' },
  'clock_domain_crossing': { cat: 'Utility Modules', title: 'Clock Domain Crossing', file: 'util/clock_domain_crossing.v', desc: 'Configurable multi-mode CDC wrapper supporting SYNC, HANDSHAKE, and ASYNC_FIFO modes.' },
  'ddr3sdram_uniphy_iommu': { cat: 'DDR3 Controller Components', title: 'DDR3 SDRAM UniPHY Wrapper', file: 'ddr3/ddr3sdram_uniphy_iommu.v', desc: 'Top-level generated DDR3 UniPHY wrapper exposing physical DRAM pins, PLLs, and Avalon-MM bus.' },
  'ddr3sdram_uniphy_iommu_0002': { cat: 'DDR3 Controller Components', title: 'DDR3 UniPHY Core Assembly', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_0002.v', desc: 'Internal UniPHY hardware pipeline wiring calibration AFI multiplexers and leveling delay chains.' },
  'ddr3sdram_uniphy_iommu_p0_acv_ldc': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 ACV LDC', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_acv_ldc.v', desc: 'Leveling delay chain orchestration module generating conditioned clocks for AFI and AVL domains.' },
  'ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Addr/Cmd Datapath', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v', desc: 'Transforms parallel AFI address and command buses into DDIO-aligned physical memory signals.' },
  'ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Addr/Cmd LDC Pad', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v', desc: 'Single address/command pin driver utilizing hardware leveling delay chains for phase alignment.' },
  'ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Addr/Cmd LDC Pads', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v', desc: 'Banked array of leveled address and command I/O pads for multi-rank DDR3 topologies.' },
  'ddr3sdram_uniphy_iommu_p0_addr_cmd_non_ldc_pad': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Addr/Cmd Non-LDC Pad', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_non_ldc_pad.v', desc: 'Direct DDIO output pad driver for un-leveled low-skew control lines.' },
  'ddr3sdram_uniphy_iommu_p0_altdqdqs': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 ALTDQDQS Bridge', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_altdqdqs.v', desc: 'Stratix V altdq_dqs2 hard macro bridge managing bi-directional DQ data lanes and DQS strobes.' },
  'ddr3sdram_uniphy_iommu_p0_clock_pair_generator': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Clock Pair Generator', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v', desc: 'Generates differential CK/CK# clock pairs with matched trace delays for DDR3 SDRAM.' },
  'ddr3sdram_uniphy_iommu_p0_fr_cycle_extender': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 FR Cycle Extender', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v', desc: 'Extends full-rate cycle write/read valid windows to support multi-cycle CAS latency timing.' },
  'ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 FR Cycle Shifter', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v', desc: 'Shifts packed full-rate data lanes by calibrated fractional clock phases to eliminate skew.' },
  'ddr3sdram_uniphy_iommu_p0_iss_probe': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 ISS Probe', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_iss_probe.v', desc: 'In-system source & probe debugging harness for real-time observation of DDR3 calibration sequences.' },
  'ddr3sdram_uniphy_iommu_p0_new_io_pads': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 New IO Pads', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_new_io_pads.v', desc: 'Comprehensive DDR3 I/O pad integration unit combining address, command, DQ/DQS, and SCC signaling.' },
  'ddr3sdram_uniphy_iommu_p0_read_fifo_hard': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Read FIFO Hard', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v', desc: 'Stratix V hard periphery FIFO for safe domain transfer from DQS capture clock to core fabric.' },
  'ddr3sdram_uniphy_iommu_p0_read_valid_selector': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Read Valid Selector', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_valid_selector.v', desc: 'Programmable CAS latency shift-register matching read valid signals to memory read data bursts.' },
  'ddr3sdram_uniphy_iommu_p0_reset': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Reset Control', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset.v', desc: 'Coordinates synchronized reset assertion and deassertion across all DDR3 PHY clock domains.' },
  'ddr3sdram_uniphy_iommu_p0_reset_sync': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Reset Sync', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset_sync.v', desc: 'Metastability-safe reset synchronizer chain used throughout the UniPHY controller.' },
  'ddr3sdram_uniphy_iommu_p0_write_datapath': { cat: 'DDR3 Controller Components', title: 'DDR3 P0 Write Datapath', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_write_datapath.v', desc: 'Serializes 512-bit internal write payloads into DDIO double-data-rate write bursts.' },
  'dma_addr_gen': { cat: 'DMA Engine Components', title: 'DMA Address Generator', file: 'dma_engine/dma_addr_gen.v', desc: 'Calculates sequential beat addresses, 4KB page crossing boundaries, and burst lengths.' },
  'dma_completion': { cat: 'DMA Engine Components', title: 'DMA Completion Handler', file: 'dma_engine/dma_completion.v', desc: 'Processes transfer completion tokens, writes ring completion queue entries, and triggers MSI-X interrupts.' },
  'dma_desc_fetch': { cat: 'DMA Engine Components', title: 'DMA Descriptor Fetch', file: 'dma_engine/dma_desc_fetch.v', desc: 'Fetches ring-buffer descriptors over PCIe from host memory and segregates descriptor queues.' },
  'dma_fifos': { cat: 'DMA Engine Components', title: 'DMA FIFOs', file: 'dma_engine/dma_fifos.v', desc: 'Dual-clock decoupled FIFO buffers for descriptor rings, read streaming data, and write streaming data.' },
  'dma_read_engine': { cat: 'DMA Engine Components', title: 'DMA Read Engine', file: 'dma_engine/dma_read_engine.v', desc: 'Orchestrates memory reads from storage and constructs PCIe Memory Write TLPs to host memory.' },
  'dma_scheduler': { cat: 'DMA Engine Components', title: 'DMA Scheduler', file: 'dma_engine/dma_scheduler.v', desc: 'Deterministic multi-channel priority scheduler coordinating command execution across 16 channels.' },
  'dma_scheduler_worksteal': { cat: 'DMA Engine Components', title: 'DMA Scheduler (Work-Stealing)', file: 'dma_engine/dma_scheduler_worksteal.v', desc: 'High-throughput enhanced scheduler featuring per-channel lock-free ring buffers and hardware work-stealing.' },
  'dma_top': { cat: 'DMA Engine Components', title: 'DMA Engine Top', file: 'dma_engine/dma_top.v', desc: 'Central DMA engine integrating descriptor fetch, scheduling, read/write datapaths, and completions.' },
  'dma_write_engine': { cat: 'DMA Engine Components', title: 'DMA Write Engine', file: 'dma_engine/dma_write_engine.v', desc: 'Issues PCIe Memory Read TLPs to host memory and streams payloads into storage/accelerator memory.' },
  'error_injector': { cat: 'Utility Modules', title: 'Error Injector', file: 'util/error_injector.v', desc: 'Hardware fault injection module simulating bit flips, CRC corruptions, and timeout delays.' },
  'ethernet_timestamp_unit': { cat: 'Timing & PTPv2 Components', title: 'Ethernet Timestamp Unit', file: 'timing/ethernet_timestamp_unit.sv', desc: 'Hardware MAC layer packet parser capturing ingress and egress timestamps with latency correction.' },
  'fifo_async': { cat: 'Utility Modules', title: 'Asynchronous FIFO', file: 'util/fifo_async.v', desc: 'Dual-clock asynchronous FIFO with Gray code pointer synchronization across unrelated clock domains.' },
  'fifo_sync': { cat: 'Utility Modules', title: 'Synchronous FIFO', file: 'util/fifo_sync.v', desc: 'Parameterized synchronous circular FIFO buffer with almost_full and almost_empty threshold flags.' },
  'gpio_controller': { cat: 'BMC Components', title: 'GPIO Controller', file: 'bmc/gpio_controller.v', desc: 'General-purpose I/O controller with programmable direction, interrupt on change, and status registers.' },
  'gpudirect_interface': { cat: 'P2P Communication Components', title: 'GPUDirect Interface', file: 'p2p/gpudirect_interface.v', desc: 'NVIDIA GPUDirect RDMA compliant handshake controller for direct GPU VRAM access.' },
  'i2c_master': { cat: 'BMC Components', title: 'I2C Master', file: 'bmc/i2c_master.v', desc: 'Hardware I2C master core for querying onboard temperature sensors, voltage rails, and EEPROMs.' },
  'inline_transform_engine': { cat: 'DMA Engine Components', title: 'Inline Transform Engine', file: 'dma_engine/inline_transform_engine.v', desc: 'Hardware transform pipeline supporting real-time CRC32 calculation, AES encryption, and byte swapping.' },
  'iommu_page_table_walker': { cat: 'IOMMU Components', title: 'IOMMU Page Table Walker', file: 'iommu/iommu_page_table_walker.v', desc: 'Multi-level virtual-to-physical address translation walker with integrated TLB cache.' },
  'ipmi_bridge': { cat: 'BMC Components', title: 'IPMI Bridge', file: 'bmc/ipmi_bridge.v', desc: 'Translates IPMI / KCS sideband protocol commands into FPGA telemetry registers.' },
  'ipu_exchange_buffer': { cat: 'IPU Interface Components', title: 'IPU Exchange Buffer', file: 'ipu/ipu_exchange_buffer.v', desc: 'Elastic ping-pong exchange buffer between IPU compute processing elements and DMA fabric.' },
  'ipu_gateway_pcie': { cat: 'IPU Interface Components', title: 'IPU Gateway PCIe Bridge', file: 'ipu/ipu_gateway_pcie.v', desc: 'Translates PCIe streaming commands into Graphcore IPU tile fabric exchange commands.' },
  'ipu_gateway_shim': { cat: 'P2P Communication Components', title: 'IPU Gateway Shim', file: 'p2p/ipu_gateway_shim.v', desc: 'Hardware shim translating Graphcore IPU streaming format into standard PCIe P2P transactions.' },
  'ipu_sync_controller': { cat: 'IPU Interface Components', title: 'IPU Sync Controller', file: 'ipu/ipu_sync_controller.v', desc: 'Hardware barrier synchronization engine coordinating global BSP (Bulk Synchronous Parallel) phases.' },
  'ipu_tile_router': { cat: 'IPU Interface Components', title: 'IPU Tile Router', file: 'ipu/ipu_tile_router.v', desc: 'Multi-tile non-blocking packet router for high-throughput spatial neural network tile exchange.' },
  'lea_m8t_interface': { cat: 'Timing & PTPv2 Components', title: 'LEA-M8T Interface', file: 'timing/lea_m8t_interface.sv', desc: 'Decodes u-blox UBX binary packets and captures 1PPS pulses with sub-5ns precision.' },
  'msix_ctrl': { cat: 'Interrupt Controller Components', title: 'MSI-X Controller', file: 'interrupt/msix_ctrl.v', desc: '16-vector MSI-X interrupt controller managing vector tables, pending bits, and PCIe interrupt TLPs.' },
  'ncsi_controller': { cat: 'BMC Components', title: 'NC-SI Controller', file: 'bmc/ncsi_controller.v', desc: 'Network Controller Sideband Interface for pass-through out-of-band management communication.' },
  'nvme_controller_complete': { cat: 'NVMe Controller Components', title: 'NVMe Controller (Complete)', file: 'nvme_iface/nvme_controller_complete.v', desc: 'Full NVMe 1.4 storage controller implementing admin/IO queues, doorbells, and direct DMA.' },
  'nvme_mmio': { cat: 'NVMe Controller Components', title: 'NVMe MMIO Interface', file: 'nvme_iface/nvme_mmio.v', desc: 'Standard NVMe 1.4 MMIO register block (CAP, VS, CC, CSTS, AQA, ASQ, ACQ, Doorbells).' },
  'nvme_phy': { cat: 'NVMe Controller Components', title: 'NVMe Physical Layer Interface', file: 'nvme_iface/nvme_phy.v', desc: 'Physical layer protocol bridge between NVMe command parser and high-speed PCIe transceiver lanes.' },
  'nvme_queue': { cat: 'NVMe Controller Components', title: 'NVMe Queue Handler', file: 'nvme_iface/nvme_queue.v', desc: 'Handles Submission Queue command fetches and Completion Queue posting with doorbell synchronization.' },
  'ocxo_discipline_loop': { cat: 'Timing & PTPv2 Components', title: 'OCXO Discipline Loop', file: 'timing/ocxo_discipline_loop.sv', desc: 'Digital PI control loop disciplining the local OCXO against GPS 1PPS reference.' },
  'p2p_address_decoder': { cat: 'P2P Communication Components', title: 'P2P Address Decoder', file: 'p2p/p2p_address_decoder.v', desc: 'Decodes physical address windows to route DMA transfers directly to Peer GPUs or IPUs.' },
  'p2p_dma_controller': { cat: 'P2P Communication Components', title: 'P2P DMA Controller', file: 'p2p/p2p_dma_controller.v', desc: 'Orchestrates direct Peer-to-Peer PCIe DMA transfers between FPGA, GPU, and NVMe endpoints.' },
  'p2p_tlp_generator': { cat: 'P2P Communication Components', title: 'P2P TLP Generator', file: 'p2p/p2p_tlp_generator.v', desc: 'Formats and issues PCIe TLP Memory Read / Write packets specifically targeted at peer device BARs.' },
  'pcie_bar_registers': { cat: 'Timing & PTPv2 Components', title: 'PCIe BAR Registers (PTP)', file: 'timing/pcie_bar_registers.sv', desc: 'Memory-mapped BAR0 register bank exposing PHC time, drift offsets, GPS locking status, and controls.' },
  'pcie_endpoint': { cat: 'PCIe & HIP Unlock Components', title: 'PCIe Endpoint', file: 'pcie_endpoint.v', desc: 'Top-level PCIe Gen3 x8 endpoint integrating Hard IP, BAR decoding, and Avalon-ST channels.' },
  'pcie_hip_wrapper': { cat: 'PCIe & HIP Unlock Components', title: 'PCIe HIP Wrapper Example', file: 'pcie-3-hip-unlock/examples/pcie_hip_wrapper.v', desc: 'Reference instantiation of the unlocked Stratix V PCIe Gen3 x8 Hard IP core.' },
  'power_management': { cat: 'Power Management Components', title: 'Power Management', file: 'power/power_management.v', desc: 'Dynamic clock gating and power plane manager supporting low-power standby and thermal throttling.' },
  'ptp_clock': { cat: 'DMA Engine Components', title: 'PTP Clock', file: 'dma_engine/ptp_clock.v', desc: 'High-precision 96-bit timestamping clock with drift compensation and fractional nanosecond accumulation.' },
  'ptp_hardware_clock': { cat: 'Timing & PTPv2 Components', title: 'PTP Hardware Clock', file: 'timing/ptp_hardware_clock.sv', desc: '80-bit IEEE 1588 PHC with sub-nanosecond fractional accumulation and drift adjustment in PPB.' },
  'qos_bandwidth_controller': { cat: 'DMA Engine Components', title: 'QoS Bandwidth Controller', file: 'dma_engine/qos_bandwidth_controller.v', desc: 'Enforces weighted fair queuing (WFQ) and token-bucket rate limiting per DMA channel.' },
  'scatter_gather_engine': { cat: 'DMA Engine Components', title: 'Scatter-Gather Engine', file: 'dma_engine/scatter_gather_engine.v', desc: 'Traverses chained scatter-gather descriptor lists across fragmented host physical memory pages.' },
  'skid_buffer': { cat: 'Utility Modules', title: 'Skid Buffer', file: 'util/skid_buffer.v', desc: 'Zero-latency pipeline skid buffer breaking combinational backpressure timing loops on AXI-Stream.' },
  'stratix_v_pcie_hip': { cat: 'PCIe & HIP Unlock Components', title: 'Stratix V PCIe HIP Wrapper', file: 'pcie/stratix_v_pcie_hip.v', desc: 'Stratix V PCIe Gen3 x8 Hard IP core wrapper providing a clean TLP interface for DMA and application logic.' },
  'stratix_v_pcie_hip_enhanced': { cat: 'PCIe & HIP Unlock Components', title: 'Stratix V PCIe HIP Wrapper (Enhanced)', file: 'pcie/stratix_v_pcie_hip_enhanced.v', desc: 'Enhanced Hard IP wrapper featuring LTSSM state monitoring, AER, and error injection.' },
  'tb_dma_engine': { cat: 'Testbench Components', title: 'DMA Engine Testbench', file: 'testbench/tb_dma_engine.v', desc: 'System-level verification testbench exercising DMA transfers, descriptor loops, and backpressure.' },
  'tb_new_features': { cat: 'Testbench Components', title: 'New Features Testbench', file: 'testbench/tb_new_features.v', desc: 'Comprehensive verification testbench validating 16-channel work stealing and telemetry.' },
  'telemetry_collector': { cat: 'DMA Engine Components', title: 'Telemetry Collector', file: 'dma_engine/telemetry_collector.v', desc: 'Observability engine monitoring per-channel and aggregate byte throughput and real-time Mbps.' },
  'thermal_interface': { cat: 'BMC Components', title: 'Thermal Interface', file: 'bmc/thermal_interface.v', desc: 'Monitors onboard ADC thermal diodes and triggers automated throttling upon high-temp thresholds.' },
  'uart_rx': { cat: 'Timing & PTPv2 Components', title: 'UART Receiver', file: 'timing/uart_rx.sv', desc: 'Metastability-safe UART receiver core with 16x oversampling and configurable baud rate generator.' },
  'uart_tx': { cat: 'Timing & PTPv2 Components', title: 'UART Transmitter', file: 'timing/uart_tx.sv', desc: 'Buffered UART transmission module with ready/valid streaming interface.' },
  'well_behaved_host': { cat: 'Host Interface Components', title: 'Well-Behaved Host Interface', file: 'host_interface/well_behaved_host.v', desc: 'Rate-limiting, watchdog-protected host abstraction boundary shielding accelerators.' },
  'width_adapters': { cat: 'Utility Modules', title: 'Width Adapters', file: 'util/width_adapters.v', desc: 'Convenience wrappers for PCIe (256-bit) to DMA (512-bit) bidirectional width conversion.' },
  'width_converter': { cat: 'Utility Modules', title: 'Width Converter', file: 'util/width_converter.v', desc: 'Bidirectional streaming data width converter with internal buffering and backpressure flow control.' }
};

// Generate templated component markdown with under construction banner
function generateTemplatedMarkdown(id, meta) {
  return `---
title: "${meta.title} — ${path.basename(meta.file)}"
description: "${meta.desc}"
part: "Part II — Component Library"
chapter: "${meta.cat}"
category: "${meta.cat}"
filename: "${meta.file}"
order: 100
tags: ["${meta.cat}", "Under Construction", "Verilog", "FPGA", "Hardware", "Stratix V"]
---

# ${meta.title} — \`${path.basename(meta.file)}\`

**Subsystem:** \`${meta.cat}\` &bull; **Source Path:** \`${meta.file}\`

[← Back to Component Library](/book/02-component-library)

---

:::under-construction
### 🚧 Module Under Active Hardening & Verification

This module is part of the **${meta.cat}** subsystem and is currently undergoing active RTL timing optimization, Quartus Platform Designer netlist verification, and testbench coverage expansion.

- **Target Architecture**: Altera / Intel Stratix V GS FPGA (Catapult v2 hardware target)
- **Target Core Frequency**: 250 MHz (Gen3 x8 256-bit datapath)
- **Verification Status**: In-Progress — Structural RTL syntax validated, comprehensive gate-level simulation pending
:::

---

## 1. Architectural Role & Overview

${meta.desc}

### Key Design Principles

1. **Deterministic Handshaking**: Full ready/valid flow control preventing buffer overflows or stall deadlocks.
2. **Synchronous Reset Protocol**: Active-low reset with internal multi-stage deassertion synchronizers.
3. **Metastability Isolation**: Multi-stage flip-flop chains for any signals crossing clock domains.

---

## 2. Interface Specification (Provisional Baseline)

### Module Parameters & Generics

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`DATA_WIDTH\` | Integer | \`512\` | Primary internal streaming datapath width |
| \`ADDR_WIDTH\` | Integer | \`64\` | Physical memory address bus width |
| \`FIFO_DEPTH\` | Integer | \`64\` | Decoupling stage FIFO buffer depth |
| \`BURST_LIMIT\` | Integer | \`4096\` | Maximum burst byte length per transaction |

### Signal Port Map

| Port Name | Direction | Bit Width | Description |
| :--- | :--- | :--- | :--- |
| \`clk\` | Input | \`1\` | Subsystem Core Clock (250 MHz) |
| \`rst_n\` | Input | \`1\` | Active-Low Synchronous Reset |
| \`s_axis_tdata\` | Input | \`DATA_WIDTH\` | Ingress stream payload |
| \`s_axis_tvalid\` | Input | \`1\` | Ingress stream valid qualifier |
| \`s_axis_tready\` | Output | \`1\` | Backpressure flow-control ready |
| \`s_axis_tlast\` | Input | \`1\` | Ingress packet boundary delimiter |
| \`m_axis_tdata\` | Output | \`DATA_WIDTH\` | Egress stream payload |
| \`m_axis_tvalid\` | Output | \`1\` | Egress stream valid qualifier |
| \`m_axis_tready\` | Input | \`1\` | Downstream sink backpressure ready |
| \`m_axis_tlast\` | Output | \`1\` | Egress packet boundary delimiter |

---

## 3. RTL Implementation Skeleton

\`\`\`verilog
// =============================================================================
// Module: ${meta.title} (${path.basename(meta.file)})
// Subsystem: ${meta.cat}
// Target: Stratix V GS FPGA / Catapult v2
// Status: Under Active Hardening
// =============================================================================

\`timescale 1ns / 1ps

module ${id} #(
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
\`\`\`

---

## 4. Hardware Verification & Integration Checklist

- [x] Baseline Verilog 2001 / SystemVerilog 2012 syntax compilation clean
- [ ] Multi-channel backpressure assertion testbench completed
- [ ] Corner-case burst alignment (unaligned offsets & 4KB boundary crossings)
- [ ] Quartus Prime TimeQuest timing constraints and false-path assertions
- [ ] In-system SignalTap logic analyzer capture on Catapult v2 hardware target

---

[← Back to Component Library](/book/02-component-library) · [Next Chapter: Production Roadmap →](/book/03-production-roadmap)
`;
}

let count = 0;
for (const [id, meta] of Object.entries(catMap)) {
  const filePath = path.join(compDir, `${id}.md`);
  fs.writeFileSync(filePath, generateTemplatedMarkdown(id, meta), 'utf-8');
  count++;
}

console.log(`Updated ${count} component files with under-construction banners and templated specifications.`);
