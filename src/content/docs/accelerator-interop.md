---
title: "Accelerator Heterogeneous Orchestration"
description: "Unified gRPC hardware acceleration layer, plan compilation, caching, and tiered memory management."
category: "Hardware & Substrates"
order: 2
badge: "Orchestration"
tags: ["Accelerator", "gRPC", "PlanEnvelope", "SPMD", "BSP", "KV-Cache"]
---

# Accelerator Heterogeneous Orchestration

**Accelerator** is a unified .NET compute execution service that runs computation plans across CPUs, Graphcore IPUs, Intel GPUs, NVIDIA CUDA, OpenCL devices, and high-speed fabrics over a structured gRPC interface.

## Core Architecture

- **`PlanEnvelope` Protocol**: Declarative DAG submitted over gRPC describing operators, tensor shapes, precision requirements, and data flow.
- **`AcceleratorManager`**: Handles backend capability probing (compute, fabric, DMA, multicast, RDMA, NVMe), device scoring, and execution dispatch.
- **Dual Operating Models**: Formally models SPMD (Intel GPU) and BSP (Graphcore IPU) execution semantics, validating behavioral contracts.
- **Content-Addressed Plan Hashing**: SHA-256 graph fingerprinting ensures repetitive subgraphs hit compiled caches instantly.

## Invocations & Benchmarks

```bash
dotnet run --project src/HFLabs/Hardware/Accelerator/Accelerator.Server.csproj -c Release
```

## Tiered KV-Cache Architecture

For large-context LLMs, Accelerator includes a tiered memory orchestration engine:
- **Pinned Layer Buffer Pool**: Active attention heads maintained in GPU VRAM or pinned host RAM.
- **Address Map & Directory**: Tracks page allocations across memory tiers with sub-millisecond lookups.
- **Asynchronous Storage Channels**: Streams overflow KV states to NVMe storage without blocking forward generation passes.
