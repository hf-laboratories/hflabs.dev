---
title: "Chapter 3 — Production Roadmap"
description: "Hardware integration guide, critical path items, and staged production readiness gates."
part: "Part I — Production Readiness"
chapter: "3. Production Roadmap"
order: 13
category: "Production Readiness"
tags: ["Roadmap", "Gates", "Stratix V", "Hard IP", "NVMe"]
---

# Production Readiness — Roadmap

[← Component Library](/book/02-component-library) · [Next → Design Summary & Verification Checklist](/book/04-design-summary-and-checklist)

This chapter bridges planning and execution: it combines the roadmap with the practical hardware integration path captured in `HARDWARE_INTEGRATION.md`.

## Hardware integration guide (execution path)

### 1) Stratix V PCIe Hard IP integration

- Use `pcie/stratix_v_pcie_hip.v` ([View Module](/book/components/stratix_v_pcie_hip)) as the production wrapper boundary.
- Generate/configure Hard IP in Quartus for **Gen3 x8**, 256-bit datapath, MSI-X enabled.
- Replace simulation/stub internals with the generated Hard IP instance.
- Keep width adapters at the PCIe ingress/egress boundary when interfacing with 512-bit internal DMA paths.
- Validate physical link state (`link_up`, width, speed) before functional throughput testing.

### 2) BAR/control-plane wiring

- Route BAR0 register reads/writes through `bar_control.v` and associated control/status paths.
- Verify byte-enable semantics and register side effects.
- Confirm host driver sequence: init registers → queue setup → interrupt setup → command submission.

### 3) NVMe integration track

- Integrate `nvme_iface/nvme_phy.v` ([View Module](/book/components/nvme_phy)) into the DMA transaction flow.
- Complete queue/doorbell/completion wiring with realistic host/device timing assumptions.
- Validate identify/read/write/flush command paths and completion reporting.

### 4) Bring-up validation staircase

1. PCIe link training and stable enumeration
2. BAR smoke tests and config-plane consistency
3. Small DMA transfers with data-integrity checks
4. Interrupt/completion path validation
5. Extended stress tests (queue depth, back-pressure, error scenarios)

## Critical path (pre-production)

1. **Stratix V Hard IP integration**
   - Replace simplified PCIe endpoint with production Hard IP core
   - Configure for Gen3 x8 operation
   - Keep width adapters at PCIe boundaries

2. **NVMe controller integration**
   - Replace placeholder NVMe interface with hardware-valid implementation
   - Verify queue and command handling against real devices

3. **Write engine PCIe read path**
   - Complete read-channel arbitration and flow control
   - Verify robust buffering behavior under back-pressure

4. **Comprehensive testing**
   - Scenario-based simulation coverage
   - Gate-level simulation
   - Hardware validation on target board

5. **Error handling and recovery**
   - Expand detection and reporting
   - Implement recovery flow for fault paths
   - Validate with fault injection

## Production readiness gates

Use these gates as go/no-go milestones:

- **Gate A — HDL Quality**
   - Syntax clean across core modules
   - Documented limitations reviewed
   - CDC and reset strategy verified

- **Gate B — Integration Correctness**
   - PCIe Hard IP integrated and link-stable
   - BAR/config path validated
   - DMA read/write command paths functionally verified

- **Gate C — System Behavior**
   - NVMe queueing/completions stable
   - Interrupt flow reliable under load
   - Error handling and recovery pass fault-injection scenarios

- **Gate D — Deployment Readiness**
   - Timing closure and synthesis constraints satisfied
   - Hardware validation results recorded
   - Performance and regression checklist signed off

## Post-production enhancements

- Performance tuning (FIFO depth, scheduling, counters)
- Power management (ASPM, gating, thermals)
- Security (DMA protections, secure boot, crypto hooks)
- Virtualization (SR-IOV, IOMMU, tenancy isolation)

---

[Next: Design Summary & Verification Checklist →](/book/04-design-summary-and-checklist)
