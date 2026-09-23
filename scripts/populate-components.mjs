import fs from 'fs';
import path from 'path';

const compDir = './src/content/book/components';
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

const components = [
  { id: 'afi_mux_ddr3_ddrx', title: 'AFI Mux DDR3 DDRx', file: 'ddr3/ddr3sdram_uniphy_iommu/afi_mux_ddr3_ddrx.v', cat: 'DDR3 Controller Components', desc: 'Multiplexes AFI signals between sequencer and controller paths during calibration and normal operation.' },
  { id: 'agent_message_router', title: 'Agent Message Router', file: 'dma_engine/agent_message_router.v', cat: 'DMA Engine Components', desc: 'Routes inter-agent messages with FIFO buffering, priority support, and zero-copy transfer coordination via DMA-safe buffer metadata.' },
  { id: 'arbiter_rr', title: 'Round-Robin Arbiter', file: 'util/arbiter_rr.v', cat: 'Utility Modules', desc: 'Implements a round-robin arbitration scheme for multiple requestors with priority masking and fair access.' },
  { id: 'bmc_mailbox', title: 'BMC Mailbox', file: 'bmc/bmc_mailbox.v', cat: 'BMC Components', desc: 'Simple mailbox register block for management plane communication between the BMC and FPGA logic.' },
  { id: 'catapult_ptp_grandmaster', title: 'Catapult PTP Grandmaster', file: 'timing/catapult_ptp_grandmaster.sv', cat: 'Timing & PTPv2 Components', desc: 'Top-level IEEE 1588 PTPv2 grandmaster integration module tying together GPS, PHC, OCXO discipline loop, Ethernet timestamping, and PCIe BAR registers.' },
  { id: 'cdc_modules', title: 'CDC Modules', file: 'util/cdc_modules.v', cat: 'Utility Modules', desc: 'Clock domain crossing primitives for safe signal (cdc_sync), pulse (cdc_pulse_sync), and data transfer (cdc_handshake).' },
  { id: 'clock_domain_crossing', title: 'Clock Domain Crossing', file: 'util/clock_domain_crossing.v', cat: 'Utility Modules', desc: 'Configurable multi-mode CDC wrapper supporting SYNC, HANDSHAKE, and ASYNC_FIFO modes.' },
  { id: 'ddr3sdram_uniphy_iommu', title: 'DDR3 SDRAM UniPHY Wrapper', file: 'ddr3/ddr3sdram_uniphy_iommu.v', cat: 'DDR3 Controller Components', desc: 'Top-level generated DDR3 UniPHY wrapper exposing memory pins and Avalon-MM access.' },
  { id: 'ddr3sdram_uniphy_iommu_0002', title: 'DDR3 UniPHY Core Assembly', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_0002.v', cat: 'DDR3 Controller Components', desc: 'Auto-generated internal DDR3 UniPHY integration block wiring AFI muxing, PHY datapaths, and reset controls.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_acv_ldc', title: 'DDR3 P0 ACV LDC', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_acv_ldc.v', cat: 'DDR3 Controller Components', desc: 'PHY clock conditioning and leveling-delay-chain orchestration for AFI/AVL/ADC/HR clock generation.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath', title: 'DDR3 P0 Addr/Cmd Datapath', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v', cat: 'DDR3 Controller Components', desc: 'Transforms AFI address/command buses into PHY-DDIO aligned outputs.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad', title: 'DDR3 P0 Addr/Cmd LDC Pad', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v', cat: 'DDR3 Controller Components', desc: 'Single address/command pad element using leveling-delay hardware for high-performance launch alignment.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads', title: 'DDR3 P0 Addr/Cmd LDC Pads', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v', cat: 'DDR3 Controller Components', desc: 'Top-level address/command pad bank implementation using PHY clocks and leveling delay chains.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_addr_cmd_non_ldc_pad', title: 'DDR3 P0 Addr/Cmd Non-LDC Pad', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_addr_cmd_non_ldc_pad.v', cat: 'DDR3 Controller Components', desc: 'Alternative non-leveling addr/cmd pad implementation using generic DDIO output logic.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_altdqdqs', title: 'DDR3 P0 ALTDQDQS Bridge', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_altdqdqs.v', cat: 'DDR3 Controller Components', desc: 'Wrapper around altdq_dqs2_stratixv for DQ/DQS read-write I/O timing and calibration.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_clock_pair_generator', title: 'DDR3 P0 Clock Pair Generator', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v', cat: 'DDR3 Controller Components', desc: 'Generates differential DDR clock pair outputs (CK/CK#) from a single input clock.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_fr_cycle_extender', title: 'DDR3 P0 FR Cycle Extender', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v', cat: 'DDR3 Controller Components', desc: 'Extends full-rate cycle data windows by configurable cycle counts to support write/read alignment.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter', title: 'DDR3 P0 FR Cycle Shifter', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v', cat: 'DDR3 Controller Components', desc: 'Shifts packed full-rate cycle lanes by programmable offsets for timing phasing and lane alignment.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_iss_probe', title: 'DDR3 P0 ISS Probe', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_iss_probe.v', cat: 'DDR3 Controller Components', desc: 'Lightweight in-system source/probe instrumentation wrapper for observing selected DDR PHY signals.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_new_io_pads', title: 'DDR3 P0 New IO Pads', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_new_io_pads.v', cat: 'DDR3 Controller Components', desc: 'Comprehensive top-level DDR3 I/O pad integration module for address, command, data, DQS, and SCC signaling.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_read_fifo_hard', title: 'DDR3 P0 Read FIFO Hard', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v', cat: 'DDR3 Controller Components', desc: 'Hard periphery FIFO wrapper for read-data re-synchronization from memory clock domain to internal clock domain.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_read_valid_selector', title: 'DDR3 P0 Read Valid Selector', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_read_valid_selector.v', cat: 'DDR3 Controller Components', desc: 'Selects read-enable/read-valid timing based on latency shift vectors and selected latency counters.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_reset', title: 'DDR3 P0 Reset Control', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset.v', cat: 'DDR3 Controller Components', desc: 'Coordinates reset distribution across AFI, addr/cmd, sequencer, SCC, and capture clock domains.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_reset_sync', title: 'DDR3 P0 Reset Sync', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_reset_sync.v', cat: 'DDR3 Controller Components', desc: 'Generic multi-stage reset synchronizer chain used across DDR3 P0 clock domains.' },
  { id: 'ddr3sdram_uniphy_iommu_p0_write_datapath', title: 'DDR3 P0 Write Datapath', file: 'ddr3/ddr3sdram_uniphy_iommu/ddr3sdram_uniphy_iommu_p0_write_datapath.v', cat: 'DDR3 Controller Components', desc: 'Transforms AFI write data, data-mask, and DQS enables into PHY-DDIO write signals.' },
  { id: 'dma_addr_gen', title: 'DMA Address Generator', file: 'dma_engine/dma_addr_gen.v', cat: 'DMA Engine Components', desc: 'Generates sequential beat addresses for DMA transfers from base address, transfer length, and burst size.' },
  { id: 'dma_completion', title: 'DMA Completion Handler', file: 'dma_engine/dma_completion.v', cat: 'DMA Engine Components', desc: 'Aggregates per-channel completion events, writes completion queue entries, and raises host interrupts.' },
  { id: 'dma_desc_fetch', title: 'DMA Descriptor Fetch', file: 'dma_engine/dma_desc_fetch.v', cat: 'DMA Engine Components', desc: 'Fetches descriptors over PCIe, parses descriptor type/flags, and forwards regular vs scatter-gather descriptor flows.' },
  { id: 'dma_fifos', title: 'DMA FIFOs', file: 'dma_engine/dma_fifos.v', cat: 'DMA Engine Components', desc: 'Packages descriptor/read-data/write-data synchronous FIFOs used to decouple DMA pipeline stages.' },
  { id: 'dma_read_engine', title: 'DMA Read Engine', file: 'dma_engine/dma_read_engine.v', cat: 'DMA Engine Components', desc: 'Executes DMA read workflows by reading from NVMe/storage and writing payloads to host memory over PCIe.' },
  { id: 'dma_scheduler', title: 'DMA Scheduler', file: 'dma_engine/dma_scheduler.v', cat: 'DMA Engine Components', desc: 'Schedules descriptors onto available DMA channels and emits normalized command tuples for read/write engines.' },
  { id: 'dma_scheduler_worksteal', title: 'DMA Scheduler (Work-Stealing)', file: 'dma_engine/dma_scheduler_worksteal.v', cat: 'DMA Engine Components', desc: 'Enhanced scheduler with per-channel work queues and hardware work stealing to rebalance load across idle/busy channels.' },
  { id: 'dma_top', title: 'DMA Engine Top', file: 'dma_engine/dma_top.v', cat: 'DMA Engine Components', desc: 'Top-level DMA integration module wiring descriptor fetch, scheduler, read/write engines, completion handling, and telemetry.' },
  { id: 'dma_write_engine', title: 'DMA Write Engine', file: 'dma_engine/dma_write_engine.v', cat: 'DMA Engine Components', desc: 'Executes DMA write workflows by reading payloads from host memory over PCIe and writing to NVMe/storage.' },
  { id: 'error_injector', title: 'Error Injector', file: 'util/error_injector.v', cat: 'Utility Modules', desc: 'Provides controlled, configurable error injection for link, TLP, timeout, command, and memory validation testing.' },
  { id: 'ethernet_timestamp_unit', title: 'Ethernet Timestamp Unit', file: 'timing/ethernet_timestamp_unit.sv', cat: 'Timing & PTPv2 Components', desc: 'Captures hardware TX/RX timestamps for PTP traffic with EtherType detection and path delay compensation.' },
  { id: 'fifo_async', title: 'Asynchronous FIFO', file: 'util/fifo_async.v', cat: 'Utility Modules', desc: 'Asynchronous FIFO with Gray code pointers for safe clock domain crossing and full/empty flags.' },
  { id: 'fifo_sync', title: 'Synchronous FIFO', file: 'util/fifo_sync.v', cat: 'Utility Modules', desc: 'Synchronous FIFO buffer with configurable data width and depth for pipelined flow control.' },
  { id: 'gpio_controller', title: 'GPIO Controller', file: 'bmc/gpio_controller.v', cat: 'BMC Components', desc: 'Simple GPIO controller with direction and output registers for BMC control and status monitoring.' },
  { id: 'gpudirect_interface', title: 'GPUDirect Interface', file: 'p2p/gpudirect_interface.v', cat: 'P2P Communication Components', desc: 'Minimal GPUDirect RDMA handshake endpoint for GPU-to-FPGA request initiation and completion signaling.' },
  { id: 'i2c_master', title: 'I2C Master', file: 'bmc/i2c_master.v', cat: 'BMC Components', desc: 'Minimal I2C master for BMC control plane with clock divider, command interface, and status reporting.' },
  { id: 'inline_transform_engine', title: 'Inline Transform Engine', file: 'dma_engine/inline_transform_engine.v', cat: 'DMA Engine Components', desc: 'Programmable inline data transformation pipeline supporting checksum (CRC32), compression, encryption hooks, and byte swapping.' },
  { id: 'iommu_page_table_walker', title: 'IOMMU Page Table Walker', file: 'iommu/iommu_page_table_walker.v', cat: 'IOMMU Components', desc: 'Hardware page-table walker for multi-level virtual-to-physical address translation with TLB integration.' },
  { id: 'ipmi_bridge', title: 'IPMI Bridge', file: 'bmc/ipmi_bridge.v', cat: 'BMC Components', desc: 'Converts IPMI command requests into BMC mailbox responses.' },
  { id: 'ipu_exchange_buffer', title: 'IPU Exchange Buffer', file: 'ipu/ipu_exchange_buffer.v', cat: 'IPU Interface Components', desc: 'Single-entry ready/valid exchange buffer for IPU data handoff between compute pipeline stages.' },
  { id: 'ipu_gateway_pcie', title: 'IPU Gateway PCIe Bridge', file: 'ipu/ipu_gateway_pcie.v', cat: 'IPU Interface Components', desc: 'Bridges PCIe TLP command/response traffic to Graphcore IPU command and response channels.' },
  { id: 'ipu_gateway_shim', title: 'IPU Gateway Shim', file: 'p2p/ipu_gateway_shim.v', cat: 'P2P Communication Components', desc: 'Bridges IPU transfer requests into the P2P DMA request fabric and returns response status.' },
  { id: 'ipu_sync_controller', title: 'IPU Sync Controller', file: 'ipu/ipu_sync_controller.v', cat: 'IPU Interface Components', desc: 'Generates synchronization acknowledgements and sync pulses for coordinating IPU tile phases.' },
  { id: 'ipu_tile_router', title: 'IPU Tile Router', file: 'ipu/ipu_tile_router.v', cat: 'IPU Interface Components', desc: 'Routes tile-to-tile messages with destination-based forwarding and arbitration.' },
  { id: 'lea_m8t_interface', title: 'LEA-M8T Interface', file: 'timing/lea_m8t_interface.sv', cat: 'Timing & PTPv2 Components', desc: 'GPS receiver interface for u-blox LEA-M8T/M6T devices, providing UBX parsing, 1PPS capture, and UTC time extraction.' },
  { id: 'msix_ctrl', title: 'MSI-X Controller', file: 'interrupt/msix_ctrl.v', cat: 'Interrupt Controller Components', desc: 'MSI-X interrupt controller managing vectors, table access, priority encoding, and PCIe MSI message generation.' },
  { id: 'ncsi_controller', title: 'NC-SI Controller', file: 'bmc/ncsi_controller.v', cat: 'BMC Components', desc: 'Network Controller Sideband Interface controller for optional sideband network management.' },
  { id: 'nvme_controller_complete', title: 'NVMe Controller (Complete)', file: 'nvme_iface/nvme_controller_complete.v', cat: 'NVMe Controller Components', desc: 'Full NVMe controller implementation with admin/IO queue management, command parsing, storage read/write, and interrupt generation.' },
  { id: 'nvme_mmio', title: 'NVMe MMIO Interface', file: 'nvme_iface/nvme_mmio.v', cat: 'NVMe Controller Components', desc: 'Handles NVMe controller MMIO registers (CAP, VS, CC, CSTS, AQA, ASQ, ACQ, INTMS, INTMC) and admin queues.' },
  { id: 'nvme_phy', title: 'NVMe Physical Layer Interface', file: 'nvme_iface/nvme_phy.v', cat: 'NVMe Controller Components', desc: 'NVMe PHY-facing command/data/completion bridge for read/write data movement and command execution.' },
  { id: 'nvme_queue', title: 'NVMe Queue Handler', file: 'nvme_iface/nvme_queue.v', cat: 'NVMe Controller Components', desc: 'Manages NVMe submission and completion queues with command fetch and completion posting.' },
  { id: 'ocxo_discipline_loop', title: 'OCXO Discipline Loop', file: 'timing/ocxo_discipline_loop.sv', cat: 'Timing & PTPv2 Components', desc: 'PI controller loop that disciplines OCXO output against GPS 1PPS timing with acquisition, locked, and holdover states.' },
  { id: 'p2p_address_decoder', title: 'P2P Address Decoder', file: 'p2p/p2p_address_decoder.v', cat: 'P2P Communication Components', desc: 'Decodes peer-to-peer transfer targets (Host, GPU, IPU) based on memory address windows.' },
  { id: 'p2p_dma_controller', title: 'P2P DMA Controller', file: 'p2p/p2p_dma_controller.v', cat: 'P2P Communication Components', desc: 'Orchestrates peer-to-peer DMA transfers, target address decoding, and TLP generation.' },
  { id: 'p2p_tlp_generator', title: 'P2P TLP Generator', file: 'p2p/p2p_tlp_generator.v', cat: 'P2P Communication Components', desc: 'Generates simplified PCIe TLP headers and packet payloads for peer-to-peer DMA transfers.' },
  { id: 'pcie_bar_registers', title: 'PCIe BAR Registers (PTP)', file: 'timing/pcie_bar_registers.sv', cat: 'Timing & PTPv2 Components', desc: 'Memory-mapped BAR0 register map for PTP Grandmaster control, PHC adjustment, GPS status, and discipline loop tuning.' },
  { id: 'pcie_endpoint', title: 'PCIe Endpoint', file: 'pcie_endpoint.v', cat: 'PCIe & HIP Unlock Components', desc: 'Stratix V Hard IP PCIe Gen3 x8 endpoint wrapper with memory read/write requests, MSI interrupts, and link status.' },
  { id: 'pcie_hip_wrapper', title: 'PCIe HIP Wrapper Example', file: 'pcie-3-hip-unlock/examples/pcie_hip_wrapper.v', cat: 'PCIe & HIP Unlock Components', desc: 'Example wrapper for Platform Designer-generated Stratix V PCIe Hard IP with Avalon-ST interface.' },
  { id: 'power_management', title: 'Power Management', file: 'power/power_management.v', cat: 'Power Management Components', desc: 'ACPI-like power-state manager with domain gating/isolation controls, clock divider scaling, and activity accounting.' },
  { id: 'ptp_clock', title: 'PTP Clock', file: 'dma_engine/ptp_clock.v', cat: 'DMA Engine Components', desc: 'IEEE 1588 high-precision 96-bit timestamping clock for DMA operations, agent coordination, and drift compensation.' },
  { id: 'ptp_hardware_clock', title: 'PTP Hardware Clock', file: 'timing/ptp_hardware_clock.sv', cat: 'Timing & PTPv2 Components', desc: '80-bit TAI timestamp counter (48-bit seconds + 32-bit nanoseconds) with frequency adjustment in parts per billion (PPB).' },
  { id: 'qos_bandwidth_controller', title: 'QoS Bandwidth Controller', file: 'dma_engine/qos_bandwidth_controller.v', cat: 'DMA Engine Components', desc: 'Adaptive bandwidth allocation using token bucket algorithm, weighted fair queuing, and optional ML feedback integration.' },
  { id: 'scatter_gather_engine', title: 'Scatter-Gather Engine', file: 'dma_engine/scatter_gather_engine.v', cat: 'DMA Engine Components', desc: 'Handles chained scatter-gather DMA operations, fetching SG lists over PCIe and decomposing into sequential transfers.' },
  { id: 'skid_buffer', title: 'Skid Buffer', file: 'util/skid_buffer.v', cat: 'Utility Modules', desc: 'AXI-Stream flow control buffer preventing combinational paths through valid/ready handshakes.' },
  { id: 'stratix_v_pcie_hip', title: 'Stratix V PCIe HIP Wrapper', file: 'pcie/stratix_v_pcie_hip.v', cat: 'PCIe & HIP Unlock Components', desc: 'Stratix V PCIe Gen3 x8 Hard IP core wrapper providing a clean TLP interface for DMA and application logic.' },
  { id: 'stratix_v_pcie_hip_enhanced', title: 'Stratix V PCIe HIP Wrapper (Enhanced)', file: 'pcie/stratix_v_pcie_hip_enhanced.v', cat: 'PCIe & HIP Unlock Components', desc: 'Enhanced Stratix V PCIe Hard IP wrapper with error injection, LTSSM state machine monitoring, and link error counters.' },
  { id: 'tb_dma_engine', title: 'DMA Engine Testbench', file: 'testbench/tb_dma_engine.v', cat: 'Testbench Components', desc: 'Functional verification testbench for agent routing, P2P DMA initiation, clock/reset sequencing, and timeout watchdog.' },
  { id: 'tb_new_features', title: 'New Features Testbench', file: 'testbench/tb_new_features.v', cat: 'Testbench Components', desc: 'Comprehensive testbench verifying 16-channel DMA, Agent Message Router, Telemetry Collector, Scatter-Gather, and Well-Behaved Host.' },
  { id: 'telemetry_collector', title: 'Telemetry Collector', file: 'dma_engine/telemetry_collector.v', cat: 'DMA Engine Components', desc: 'Performance monitoring engine tracking per-channel and global transfer counts, byte volumes, errors, and real-time throughput.' },
  { id: 'thermal_interface', title: 'Thermal Interface', file: 'bmc/thermal_interface.v', cat: 'BMC Components', desc: 'Tracks temperature sensor inputs, converts to Celsius, and asserts overtemperature alarms.' },
  { id: 'uart_rx', title: 'UART Receiver', file: 'timing/uart_rx.sv', cat: 'Timing & PTPv2 Components', desc: 'SystemVerilog UART RX module with 3-stage metastability protection, baud rate timing, parity, and frame error detection.' },
  { id: 'uart_tx', title: 'UART Transmitter', file: 'timing/uart_tx.sv', cat: 'Timing & PTPv2 Components', desc: 'SystemVerilog UART TX module with ready/valid handshake and configurable baud rate / parity.' },
  { id: 'well_behaved_host', title: 'Well-Behaved Host Interface', file: 'host_interface/well_behaved_host.v', cat: 'Host Interface Components', desc: 'Policy-aware host abstraction layer for compute accelerators enforcing rate limits, timeout checks, and resource allocation.' },
  { id: 'width_adapters', title: 'Width Adapters', file: 'util/width_adapters.v', cat: 'Utility Modules', desc: 'Convenience wrappers for PCIe (256-bit) to DMA (512-bit) bidirectional width conversion.' },
  { id: 'width_converter', title: 'Width Converter', file: 'util/width_converter.v', cat: 'Utility Modules', desc: 'Bidirectional width converter with buffering, flow control, and last-signal propagation for power-of-two width ratios.' }
];

for (const comp of components) {
  const filePath = path.join(compDir, `${comp.id}.md`);
  if (!fs.existsSync(filePath)) {
    const md = `---
title: "${comp.title} — ${path.basename(comp.file)}"
description: "${comp.desc}"
part: "Part II — Component Library"
chapter: "${comp.cat}"
category: "${comp.cat}"
filename: "${comp.file}"
order: 100
tags: ["${comp.cat}", "Verilog", "FPGA", "Hardware"]
---

# ${comp.title} — ${path.basename(comp.file)}

**Filename:** \`${comp.file}\`

[← Back to Component Library](/book/02-component-library)

## Description

${comp.desc}

## Integration Points

- Sits at the **${comp.cat}** subsystem boundary
- Connects to adjacent clock/reset and data stream pipelines
- Parameterized interface for flexible platform integration

## Verilog Module Interface

\`\`\`verilog
// ${comp.title} (${path.basename(comp.file)})
// Subsystem: ${comp.cat}
// Source Path: ${comp.file}
\`\`\`
`;
    fs.writeFileSync(filePath, md, 'utf-8');
    console.log(`Created component page: ${comp.id}.md`);
  }
}

console.log(`All ${components.length} component pages verified.`);
