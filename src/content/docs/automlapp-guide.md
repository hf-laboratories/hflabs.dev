---
title: "AutoMLApp Node-Graph Guide"
description: "Visual pipeline editor with 185+ node types across 25+ domains, F7 invariant validation, and HyperSwarm integration."
category: "Optimization & Swarms"
order: 3
badge: "Desktop App"
tags: ["AutoMLApp", "NodeGraph", "WinForms", ".NET 10", "AutoML"]
---

# AutoMLApp Node-Graph Guide

**AutoMLApp** is a high-performance Windows desktop node-graph editor (.NET 10 / WinForms) for designing, validating, and executing machine learning, hardware accelerator, and swarm optimization pipelines.

## Key Features

- **185+ Node Types across 25+ Domains**: Data pipelines, ONNX models, IPU tile configurations, spiking networks, swarm optimizers, FPGA bitstreams, and telemetry sidecars.
- **Instant F7 Invariant Validation**: Runs static graph analysis to flag cycles, disconnected ports, orphaned nodes, and port type mismatches before execution.
- **Topological Plan Compilation**: Compiles the visual canvas into standardized execution plans dispatchable to local accelerators or remote nodes.
- **HyperSwarm-Backed AutoML**: Automated neural architecture and hyperparameter search with cost-aware telemetry scoring.

## Launching & Invocations

### 1. Launch Visual Desktop Canvas
```bash
dotnet run --project src/HFLabs/Products/AutoMLApp/AutoMLApp.csproj -c Release
```

### 2. Headless SwarmML Optimizer
```bash
dotnet run --project src/HFLabs/Products/AutoMLApp/SwarmML.csproj -- optimize --iterations 500 --config pipeline.json
```

## Node Connector Types & Validation Rules

Ports enforce strict type compatibility. Canvas links are rejected in real-time if schemas mismatch:
- `Tensor<T>`: Multi-dimensional array tensors (FP32, FP16, BF16, INT8).
- `GraphContext`: In-memory property graph and embedding states.
- `SwarmConfig`: Population, velocity limits, and fitness objective handlers.
- `IPUTileMap`: Spatial tile allocations for Graphcore Colossus processors.
