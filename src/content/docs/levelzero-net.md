---
title: "LevelZero.NET & L0 Kernel Catalog"
description: "Managed .NET wrapper for Intel Level Zero GPU compute with 26 precompiled OpenCL C kernels across 11 Intel targets."
category: "Hardware & Substrates"
order: 1
badge: "GPU Substrate"
tags: ["LevelZero", "Intel GPU", "SPIR-V", "Zebin", "OneAPI"]
---

# LevelZero.NET & L0 Kernel Catalog

**LevelZero.NET** is a high-performance managed .NET wrapper for the Intel OneAPI Level Zero GPU driver interface, providing direct device control, Unified Shared Memory (USM) allocations, and native binary kernel dispatch.

## L0 Kernel Catalog

The **L0 Kernel Catalog** contains **26 precompiled OpenCL C kernel sources** compiled to both standard SPIR-V and device-native Zebin formats across **11 Intel GPU targets**:

- **Integrated GPUs**: Intel Iris Xe GT2 (`tgllp`), Meteor Lake (`mtl`), Lunar Lake (`lnl`), Arrow Lake (`arl`), Panther Lake (`ptl`).
- **Discrete GPUs**: Intel Arc Alchemist (A770, A750, A380 / `dg2`), Battlemage (`bmg`).
- **Data Center GPUs**: Intel Data Center GPU Flex series, Intel Data Center GPU Max (`pvc` Ponte Vecchio).

## Auditing & Verification Commands

### 1. Audit Precompiled SPIR-V Kernels
```bash
pwsh -File src/HFLabs/Hardware/LevelZero.Toolchain/Audit-SpvKernels.ps1
```

### 2. Run Native Level Zero ABI Probes
```bash
pwsh -File src/HFLabs/Hardware/LevelZero.Toolchain/Test-LevelZeroAbi.ps1
```

### 3. Run Kernel Catalog Test Suite
```bash
dotnet test src/HFLabs/Hardware/KernelCatalog/KernelCatalog.Tests.csproj
```

## 16 Domain Kernel Wrappers

- `pso_swarm_update`: Parallel particle velocity, position update, and boundary clamping.
- `fitness_sphere_batch`: Batch vector evaluation for benchmark objectives.
- `snn_lif_membrane`: Leaky integrate-and-fire membrane potential integration.
- `snn_stdp_plasticity`: Synaptic weight update with exponential timing windows.
- `dominance_pareto_sort`: GPU-parallel non-dominated sorting for multi-objective optimization.
- `vector_cosine_similarity`: High-throughput dense vector dot and cosine distance.
- `nbody_interaction`: Pairwise gravitational / attraction vector simulation.
