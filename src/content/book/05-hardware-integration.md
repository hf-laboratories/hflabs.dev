---
title: "Chapter 5 — Hardware Integration Notes"
description: "Curated integration boundaries, clocking, PCIe, NVMe, and board bring-up notes from the Catapult PTP repository."
part: "Part III — Integration Notes"
chapter: "5. Hardware Integration"
order: 20
category: "Integration"
tags: ["Catapult v2", "Stratix V", "PCIe", "NVMe", "Bring-up"]
---

# Hardware Integration Notes

This chapter gathers the hardware-facing details scattered through the Catapult project. It is an integration guide for the documented design, not evidence that every proposed subsystem has been built or validated on a board. The [repository README](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/README.md), [hardware integration notes](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/HARDWARE_INTEGRATION.md), and Quartus project files are the source references.

## System boundary

The intended data path joins a PCIe endpoint, BAR-mapped control plane, DMA subsystem, and NVMe command/data path. MSI-X carries completion notifications. PTP timing, telemetry, management interfaces, and peer-to-peer routing are adjacent features in the repository; their presence in the tree does not imply that all are wired into one verified bitstream.

The documented datapath uses a 256-bit PCIe-side interface and a 512-bit internal DMA path. A width adapter belongs at that boundary, with ready/valid backpressure and packet-end (`last`) handling preserved. The design notes call out width mismatch as a known integration risk, so do not treat a simple truncation or padding connection as equivalent.

## PCIe Hard IP boundary

The project targets a Stratix V PCIe Gen3 x8 configuration. The documented integration plan calls for a 256-bit application datapath, BAR0 control access, MSI-X, and live link-state checks before DMA tests. The source also contains simplified endpoint/wrapper logic and Hard IP configuration guidance; generated Quartus IP and successful physical link training must be verified for the exact board and Quartus version.

Bring-up sequence:

1. Generate and integrate the device-specific PCIe Hard IP in Quartus.
2. Confirm PERST#, reference clock, lane mapping, link-up, negotiated width, and speed.
3. Enumerate from the host and test BAR0 reads/writes and byte enables.
4. Configure DMA rings and verify a small transfer with known data before increasing burst size or queue depth.
5. Exercise completion and MSI-X behavior, then test backpressure and error paths.

The repository includes PCIe Hard IP unlock documentation. Review its license notice and applicable vendor/community terms before using that procedure; the guide is not a statement that a generated core is production licensed.

## DMA and NVMe boundary

The DMA RTL is organized around descriptor fetch, scheduling, address generation, read/write engines, buffering, and completion reporting. The source implementation documents 64-bit addresses, descriptor and completion queues, and configurable queue/buffer parameters. Those are design parameters, not measured throughput guarantees.

The NVMe documentation describes the controller-register and queue path, but the integration guide explicitly lists the PHY/controller connection and realistic command/completion timing as work to complete. Keep this distinction visible: a register model or queue module is not proof of a working SSD interface. Validate identify, read, write, flush, and error completion behavior against a real target before describing end-to-end NVMe operation as complete.

## Clocking and reset

The design notes distinguish the PCIe reference clock, a user/application clock, and a system clock, while also recording that portions of the current design operate in a single user-clock domain. CDC helper modules exist, but their existence alone does not establish that every crossing in the integrated design is covered. For each asynchronous boundary, identify the source and destination clocks, choose a synchronizer or handshake/FIFO appropriate to the signal, constrain it in TimeQuest, and verify reset assertion and deassertion behavior.

## Board-specific constraints

The repository contains Catapult v2 references, Stratix V project settings, and board/host-interface documentation. Pin assignments, transceiver channel mapping, reference-clock routing, DDR3 PHY calibration, and reset polarity are board-specific. Confirm them against the exact board revision and vendor documentation; do not copy example assignments as universal pinout data.

## Sources

- [Catapult PTP README](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/README.md)
- [Hardware Integration Guide](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/HARDWARE_INTEGRATION.md)
- [Quartus project assignments](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/catapult_ptp.qsf)
- [Timing constraints](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/catapult_ptp.sdc)
- [Host interface notes](https://github.com/hf-laboratories/IPUServices/blob/main/src/HFLabs/Hardware/Fpga.Catapult/catapult_ptp/host_interface/README.md)
