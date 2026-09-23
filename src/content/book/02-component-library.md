---
title: "Chapter 2 — Component Library"
description: "Categorized index of 80+ reusable FPGA modules and components across DMA, PCIe, NVMe, PTPv2, Memory, and BMC."
part: "Part I — Production Readiness"
chapter: "2. Component Library Index"
order: 12
category: "Component Library"
tags: ["Component Library", "Modules", "Verilog", "SystemVerilog", "Architecture"]
---

# Component Library

[← Enhancements Implemented](/book/01-enhancements-implemented) · [Next → Production Roadmap](/book/03-production-roadmap)

This section is an auto-generated index of all reusable FPGA modules and components in this project. Each entry links to a dedicated page with complete Verilog/SystemVerilog source code, architectural descriptions, interface specifications, and integration notes.

## Component Index

80+ components and counting, across utility modules, BMC components, DDR3 controller components, DMA engine components, host interface components, interrupt controller components, IOMMU components, Graphcore IPU interface components, NVMe controller components, P2P communication components, PCIe endpoint and HIP unlock components, power management components, testbench components, and timing/PTPv2/synchronization components.

### Utility Modules

- [Width Converter (`width_converter.v`)](/book/components/width_converter)
- [Width Adapters (`width_adapters.v`)](/book/components/width_adapters)
- [CDC Modules (`cdc_modules.v`)](/book/components/cdc_modules)
- [Clock Domain Crossing (`clock_domain_crossing.v`)](/book/components/clock_domain_crossing)
- [Skid Buffer (`skid_buffer.v`)](/book/components/skid_buffer)
- [Synchronous FIFO (`fifo_sync.v`)](/book/components/fifo_sync)
- [Asynchronous FIFO (`fifo_async.v`)](/book/components/fifo_async)
- [Round-Robin Arbiter (`arbiter_rr.v`)](/book/components/arbiter_rr)
- [Error Injector (`error_injector.v`)](/book/components/error_injector)
- [Advanced Error Recovery (`advanced_error_recovery.v`)](/book/components/advanced_error_recovery)

### BMC & Management Components

- [BMC Mailbox (`bmc_mailbox.v`)](/book/components/bmc_mailbox)
- [GPIO Controller (`gpio_controller.v`)](/book/components/gpio_controller)
- [I2C Master (`i2c_master.v`)](/book/components/i2c_master)
- [IPMI Bridge (`ipmi_bridge.v`)](/book/components/ipmi_bridge)
- [NC-SI Controller (`ncsi_controller.v`)](/book/components/ncsi_controller)
- [Thermal Interface (`thermal_interface.v`)](/book/components/thermal_interface)

### DDR3 Controller Components

- [DDR3 SDRAM UniPHY Wrapper (`ddr3sdram_uniphy_iommu.v`)](/book/components/ddr3sdram_uniphy_iommu)
- [DDR3 UniPHY Core Assembly (`ddr3sdram_uniphy_iommu_0002.v`)](/book/components/ddr3sdram_uniphy_iommu_0002)
- [AFI Mux DDR3 DDRx (`afi_mux_ddr3_ddrx.v`)](/book/components/afi_mux_ddr3_ddrx)
- [DDR3 P0 ACV LDC (`ddr3sdram_uniphy_iommu_p0_acv_ldc.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_acv_ldc)
- [DDR3 P0 Addr/Cmd Datapath (`ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_addr_cmd_datapath)
- [DDR3 P0 Addr/Cmd LDC Pad (`ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pad)
- [DDR3 P0 Addr/Cmd LDC Pads (`ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_addr_cmd_ldc_pads)
- [DDR3 P0 Addr/Cmd Non-LDC Pad (`ddr3sdram_uniphy_iommu_p0_addr_cmd_non_ldc_pad.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_addr_cmd_non_ldc_pad)
- [DDR3 P0 ALTDQDQS Bridge (`ddr3sdram_uniphy_iommu_p0_altdqdqs.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_altdqdqs)
- [DDR3 P0 Clock Pair Generator (`ddr3sdram_uniphy_iommu_p0_clock_pair_generator.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_clock_pair_generator)
- [DDR3 P0 FR Cycle Extender (`ddr3sdram_uniphy_iommu_p0_fr_cycle_extender.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_fr_cycle_extender)
- [DDR3 P0 FR Cycle Shifter (`ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_fr_cycle_shifter)
- [DDR3 P0 ISS Probe (`ddr3sdram_uniphy_iommu_p0_iss_probe.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_iss_probe)
- [DDR3 P0 New IO Pads (`ddr3sdram_uniphy_iommu_p0_new_io_pads.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_new_io_pads)
- [DDR3 P0 Read FIFO Hard (`ddr3sdram_uniphy_iommu_p0_read_fifo_hard.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_read_fifo_hard)
- [DDR3 P0 Read Valid Selector (`ddr3sdram_uniphy_iommu_p0_read_valid_selector.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_read_valid_selector)
- [DDR3 P0 Reset Control (`ddr3sdram_uniphy_iommu_p0_reset.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_reset)
- [DDR3 P0 Reset Sync (`ddr3sdram_uniphy_iommu_p0_reset_sync.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_reset_sync)
- [DDR3 P0 Write Datapath (`ddr3sdram_uniphy_iommu_p0_write_datapath.v`)](/book/components/ddr3sdram_uniphy_iommu_p0_write_datapath)

### DMA Engine Components

- [DMA Engine Top (`dma_top.v`)](/book/components/dma_top)
- [DMA Descriptor Fetch (`dma_desc_fetch.v`)](/book/components/dma_desc_fetch)
- [DMA Scheduler (`dma_scheduler.v`)](/book/components/dma_scheduler)
- [DMA Scheduler (Work-Stealing) (`dma_scheduler_worksteal.v`)](/book/components/dma_scheduler_worksteal)
- [DMA Read Engine (`dma_read_engine.v`)](/book/components/dma_read_engine)
- [DMA Write Engine (`dma_write_engine.v`)](/book/components/dma_write_engine)
- [DMA Completion Handler (`dma_completion.v`)](/book/components/dma_completion)
- [DMA Address Generator (`dma_addr_gen.v`)](/book/components/dma_addr_gen)
- [DMA FIFOs (`dma_fifos.v`)](/book/components/dma_fifos)
- [Scatter-Gather Engine (`scatter_gather_engine.v`)](/book/components/scatter_gather_engine)
- [Agent Message Router (`agent_message_router.v`)](/book/components/agent_message_router)
- [Inline Transform Engine (`inline_transform_engine.v`)](/book/components/inline_transform_engine)
- [PTP Clock (`ptp_clock.v`)](/book/components/ptp_clock)
- [QoS Bandwidth Controller (`qos_bandwidth_controller.v`)](/book/components/qos_bandwidth_controller)
- [Telemetry Collector (`telemetry_collector.v`)](/book/components/telemetry_collector)

### Host Interface Component

- [Well-Behaved Host Interface (`well_behaved_host.v`)](/book/components/well_behaved_host)

### Interrupt Controller Component

- [MSI-X Controller (`msix_ctrl.v`)](/book/components/msix_ctrl)

### IOMMU Component

- [IOMMU Page Table Walker (`iommu_page_table_walker.v`)](/book/components/iommu_page_table_walker)

### Graphcore IPU Interface Components

- [IPU Gateway PCIe Bridge (`ipu_gateway_pcie.v`)](/book/components/ipu_gateway_pcie)
- [IPU Tile Router (`ipu_tile_router.v`)](/book/components/ipu_tile_router)
- [IPU Exchange Buffer (`ipu_exchange_buffer.v`)](/book/components/ipu_exchange_buffer)
- [IPU Sync Controller (`ipu_sync_controller.v`)](/book/components/ipu_sync_controller)

### NVMe Controller Components

- [NVMe Controller (Complete) (`nvme_controller_complete.v`)](/book/components/nvme_controller_complete)
- [NVMe Queue Handler (`nvme_queue.v`)](/book/components/nvme_queue)
- [NVMe MMIO Interface (`nvme_mmio.v`)](/book/components/nvme_mmio)
- [NVMe Physical Layer Interface (`nvme_phy.v`)](/book/components/nvme_phy)

### P2P Communication Components

- [P2P DMA Controller (`p2p_dma_controller.v`)](/book/components/p2p_dma_controller)
- [P2P TLP Generator (`p2p_tlp_generator.v`)](/book/components/p2p_tlp_generator)
- [P2P Address Decoder (`p2p_address_decoder.v`)](/book/components/p2p_address_decoder)
- [IPU Gateway Shim (`ipu_gateway_shim.v`)](/book/components/ipu_gateway_shim)
- [GPUDirect Interface (`gpudirect_interface.v`)](/book/components/gpudirect_interface)

### PCIe Endpoint Components & HIP Unlock Components

- [PCIe Endpoint (`pcie_endpoint.v`)](/book/components/pcie_endpoint)
- [Stratix V PCIe HIP Wrapper (`stratix_v_pcie_hip.v`)](/book/components/stratix_v_pcie_hip)
- [Stratix V PCIe HIP Wrapper (Enhanced) (`stratix_v_pcie_hip_enhanced.v`)](/book/components/stratix_v_pcie_hip_enhanced)
- [PCIe HIP Wrapper Example (`pcie_hip_wrapper.v`)](/book/components/pcie_hip_wrapper)

### Power Management Components

- [Power Management (`power_management.v`)](/book/components/power_management)

### Testbench Components

- [DMA Engine Testbench (`tb_dma_engine.v`)](/book/components/tb_dma_engine)
- [New Features Testbench (`tb_new_features.v`)](/book/components/tb_new_features)

### Timing, PTPv2, & Synchronization Components

- [Catapult PTP Grandmaster (`catapult_ptp_grandmaster.sv`)](/book/components/catapult_ptp_grandmaster)
- [PTP Hardware Clock (`ptp_hardware_clock.sv`)](/book/components/ptp_hardware_clock)
- [Ethernet Timestamp Unit (`ethernet_timestamp_unit.sv`)](/book/components/ethernet_timestamp_unit)
- [OCXO Discipline Loop (`ocxo_discipline_loop.sv`)](/book/components/ocxo_discipline_loop)
- [LEA-M8T Interface (`lea_m8t_interface.sv`)](/book/components/lea_m8t_interface)
- [PCIe BAR Registers (PTP) (`pcie_bar_registers.sv`)](/book/components/pcie_bar_registers)
- [UART Receiver (`uart_rx.sv`)](/book/components/uart_rx)
- [UART Transmitter (`uart_tx.sv`)](/book/components/uart_tx)
- [PTP Clock (`ptp_clock.v`)](/book/components/ptp_clock)
