---
title: "Getting Started with HFLabs"
description: "Quickstart guide, prerequisites, repository layout, and verification steps for HFLabs."
category: "Overview & Setup"
order: 1
badge: "Quickstart"
tags: ["Setup", ".NET 10", "Level Zero", "IPU"]
---

# Getting Started with HFLabs

Welcome to the **HFLabs** developer documentation. This guide walks you through system prerequisites, repository structure, and verified command recipes to build, test, and run HFLabs products on your local workstation.

## Core Design Principles

HFLabs systems are designed from first principles around three strict architectural rules:

1. **Zero Cloud Dependencies in the Loop**: All optimization, knowledge graph inference, and LLM execution runs 100% locally on your workstation or air-gapped on-premises cluster.
2. **Deterministic & Inspectable Execution**: Pipelines emit structured telemetry sidecars and detailed audit trails at every step.
3. **Hardware Agnostic with Accelerators**: CPU SIMD (AVX-512 / Neon) provides the baseline; Intel Level Zero GPUs and Graphcore IPUs act as optional high-throughput accelerators.

## Prerequisites

Ensure your environment has the following toolchains installed:

- **.NET 10 SDK** (or .NET 9.0+) with C# 13 language support.
- **PowerShell 7+ (`pwsh`)** for cross-platform automation scripts.
- **Intel OneAPI Level Zero Loader & Drivers** (optional, required for Intel Iris Xe / Arc GPU acceleration).
- **Graphcore Poplar SDK** (optional, required for IPU compute).

## Repository Organization

```
src/HFLabs/
├── Products/
│   ├── HypertensorGraphRAG/      # In-memory property graph & vector engine
│   ├── HyperSwarmOptimization/  # 35 swarm optimizers & Director ensemble
│   ├── SwarmDev/                 # 6-stage deterministic pipeline
│   ├── AutoMLApp/                # WinForms node-graph editor (.NET 10)
│   └── QueryAccel/               # IPU SQL query acceleration extension
├── Libraries/
│   └── ML/                       # HPO, KGE, Level Zero LLM & SNN engines
├── Hardware/
│   ├── LevelZero.NET/            # Managed Intel Level Zero GPU compute wrapper
│   ├── KernelCatalog/            # 26 precompiled SPIR-V & Zebin OpenCL C kernels
│   ├── Accelerator/              # gRPC PlanEnvelope heterogeneous orchestrator
│   └── Poplar.NET/               # Graphcore Poplar/PopART driver bindings
└── DevTools/
    └── ABIGen/                   # libclang C/C++ header binding synthesizer
```

## Quick Verification Recipe

Run the baseline smoke tests to ensure your local environment is configured:

```bash
# 1. Run GraphRAG headless test query
dotnet run --project src/HFLabs/Products/HypertensorGraphRAG/App/App.csproj -c Release -- --headless --query "Director"

# 2. Run HyperSwarm benchmark sweep
dotnet run --project src/HFLabs/Products/HyperSwarmOptimizationSuite/BenchmarkRunner.csproj -c Release -- matrix-sweep

# 3. Audit Level Zero precompiled SPIR-V kernels
pwsh -File src/HFLabs/Hardware/LevelZero.Toolchain/Audit-SpvKernels.ps1
```
