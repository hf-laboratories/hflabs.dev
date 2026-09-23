---
title: "FPGA Book Summary & Table of Contents"
description: "Table of Contents and navigation index for the FPGA PCIe DMA Engine production readiness book."
part: "Introduction"
chapter: "Table of Contents"
order: 1
category: "Introduction"
tags: ["Table of Contents", "Summary", "Index"]
---

# FPGA Book Summary

## Part I — Production Readiness

1. [Chapter 0 — Overview](/book/00-overview)
2. [Chapter 1 — Enhancements Implemented](/book/01-enhancements-implemented)
3. [Chapter 2 — Component Library Index](/book/02-component-library)
4. [Chapter 3 — Production Roadmap](/book/03-production-roadmap)
5. [Chapter 4 — Design Summary & Verification Checklist](/book/04-design-summary-and-checklist)

## Part II — Component Library Deep-Dives

Browse the categorized [Component Library](/book/02-component-library) containing over 80 production HDL modules across:

- **Utility & Safety Primitives**: Width Converter, CDC Modules, Skid Buffers, Sync/Async FIFOs, Arbiters, Error Recovery
- **DMA Engine Core**: Top Integration, Descriptor Fetch, Deterministic Schedulers, Work-Stealing, Read/Write Engines, Completion Queues, Scatter-Gather
- **PCIe & Hard IP**: Gen3 x8 Endpoint, Stratix V HIP Wrappers, BAR Registers
- **NVMe Storage Plane**: Complete Controller, MMIO Registers, Queue Handler, Physical Layer
- **P2P & Agent Mesh**: Agent Message Router, GPUDirect RDMA, IPU Gateway Shim, P2P TLP Generator
- **Timing & IEEE 1588 PTPv2**: Catapult Grandmaster, PHC, OCXO Discipline Loop, Ethernet Timestamp Unit, LEA-M8T GPS Interface
- **BMC & Management**: Mailbox, I2C Master, GPIO, Thermal Monitoring, IPMI Bridge, NC-SI
- **Memory & DDR3 Controller**: UniPHY Wrappers, AFI Mux, Datapaths, Phase Timing & IO Pads

## Part III — Appendix

- [Reference Links & Source Docs](/book/appendix-links)
