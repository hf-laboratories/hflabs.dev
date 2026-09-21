---
title: "HyperSwarm Optimization Suite & Benchmarks"
description: "Execute matrix sweeps, dynamic Director authority switching, and evaluate 35 optimizer modes."
category: "Optimization & Swarms"
order: 1
badge: "Production Ready"
tags: ["HyperSwarm", "Metaheuristics", "PSO", "Level Zero", "Benchmarks"]
---

# HyperSwarm Optimization Suite & Benchmarks

The **HyperSwarm Optimization Suite** is a high-assurance metaheuristic framework containing **35 optimizer modes** (12 core swarm models, 14 hybrids, and 9 advanced/multi-objective engines) with compiled Intel Level Zero GPU kernels.

## 35 Optimizer Modes Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                        35 Optimizer Modes                              │
├───────────────────────┬────────────────────────┬───────────────────────┤
│ Core Swarms (12)      │ Hybrid Engines (14)    │ Advanced & MO (9)     │
│ • Particle Swarm (PSO)│ • PSO-GA Hybrid        │ • NSGA-II Multi-Obj   │
│ • Ant Colony (ACO)    │ • Bat-Firefly Hybrid   │ • MO-PSO Pareto       │
│ • Artificial Bee (ABC)│ • Gravitational-PSO    │ • Of Bats & Beacons   │
│ • Grey Wolf (GWO)     │ • Cuckoo-Differential  │ • TuRBO Trust-Region  │
│ • Whale (WOA)         │ • Harmony-Nelder-Mead  │ • Quantum Delta PSO   │
│ • Harris Hawks (HHO)  │ • Cultural Annealing   │ • Chaos Levy Swarm    │
│ • Firefly & Bat Swarm │ • Biogeography-Swarm   │ • Dynamic Director    │
└───────────────────────┴────────────────────────┴───────────────────────┘
```

## Director Dynamic Ensembles

The **Director** is an adaptive meta-controller that orchestrates sub-swarm fleets. It tracks swarm diversity, velocity stagnation, and fitness gradients, dynamically reallocating compute budgets and authority across competing optimizers during search execution.

## Benchmark Runner Invocations

### 1. Matrix Sweep across All 35 Optimizers
```bash
dotnet run --project src/HFLabs/Products/HyperSwarmOptimizationSuite/BenchmarkRunner.csproj -c Release -- matrix-sweep
```

### 2. Multi-Objective Pareto Benchmark
```bash
dotnet run --project src/HFLabs/Products/HyperSwarmOptimizationSuite/BenchmarkRunner.csproj -c Release -- mo-bench --objectives 3 --pop 200
```

### 3. GPU Offload Verification on Intel Level Zero
```bash
dotnet run --project src/HFLabs/Products/HyperSwarmOptimizationSuite/BenchmarkRunner.csproj -c Release -- test-gpu --device-id 0
```

## Output Telemetry

Benchmark runs emit structured JSON summaries recording:
- **Best Fitness & Convergence Iteration**
- **Hypervolume Indicator (for Multi-Objective Pareto fronts)**
- **Spatial Diversity Index & Velocity Entropy**
- **GPU Kernel Execution Time vs Host Marshaling Overhead**
