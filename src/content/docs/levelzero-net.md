---
title: "LevelZero.NET & Kernel Catalog"
description: "Intel GPU compute from .NET, one DLL, no driver SDK to install. Managed API, native shim, and 407 pre-compiled kernel modules."
category: "Hardware & Substrates"
order: 1
badge: "GPU Substrate"
tags: ["LevelZero", "Intel GPU", "SPIR-V", "Zebin", "OneAPI", "ComputeDevice"]
---

# LevelZero.NET and Kernel Catalog

**Intel GPU compute from .NET, one DLL, no driver SDK to install.**

**LevelZero.NET** is a .NET wrapper for Intel Level Zero GPU compute, carrying a large catalog of pre-built kernels for the workloads that recur across HF Labs' own work: swarm optimization, spiking neural networks, and local LLM inference. 

Everything ships in a single DLL: managed API, an HFLabs-authored native shim, and **407 pre-compiled kernel modules** (37 distinct kernels compiled for each of 11 Intel GPU targets: 37 &times; 11 = 407, from 11th-gen Iris Xe through Battlemage and Panther Lake). You still need Intel's own Level Zero driver on the target machine, but nothing else. The vendor loader itself is not redistributed.

---

## Zero Boilerplate

`ComputeDevice` handles driver initialization, context, queue and command-list setup for you. `SharedBuffer<T>` wraps unified shared memory allocations behind a typed `Span<T>`, so kernel I/O reads like ordinary array access.

```csharp
using var device = LevelZeroRuntime.GetDefaultDevice();
using var fitness = FitnessKernel.Create(device);
float[] results = fitness.Evaluate(positions, count: 1000, dimensions: 10);
```

---

## 37 Kernel Wrappers, Across Four Domains

### 1. Swarm and Evolutionary Optimization (14 kernels)
- **fitness evaluation**: Batch evaluation of high-dimensional benchmark and custom objective surfaces.
- **PSO velocity/position update**: Parallel particle kinematic updates with inertial damping and spatial bounds clamping.
- **differential-evolution mutation**: Vector recombination, crossover mutation, and boundary reflection.
- **CMA-ES covariance update**: Fast rank-μ covariance matrix adaptation update calculus.
- **ant-colony transition selection**: Pheromone-weighted probabilistic path and edge selection.
- **Pareto dominance counting**: GPU-parallel non-dominated sorting and dominance rank assignment.
- **Monte Carlo hypervolume estimation**: High-dimensional Pareto front boundary hypervolume estimation.
- **IGD+ directional distance**: Inverted Generational Distance Plus directional convergence metric.
- **firefly attraction**: Light intensity inverse-square attenuation and swarm brightness convergence.
- **pairwise distance**: Dense Euclidean and Manhattan metric calculation across all swarm agents.
- **exchange-topology weights**: Multi-island migration topology weighting and topology synchronization.
- **tile-placement cost**: Spatial floorplanning constraint metrics and wirelength optimization.
- **N-body force layout**: Pairwise attractive and repulsive node placement for graph layout.
- **hypergraph scoring**: Higher-order hyperedge affinity and modularity metric evaluation.

### 2. LLM Inference (15 kernels — Full Decode Path)
The complete decode and autoregressive token generation pipeline:
- **GEMM/GEMV**: High-throughput general matrix-matrix and matrix-vector multiplication.
- **fused self-attention**: Scaled dot-product flash self-attention.
- **RoPE**: Rotary position embedding calculation with precomputed frequency vectors.
- **RMSNorm**: Root Mean Square layer normalization with learnable gains.
- **SwiGLU**: Gated feed-forward network activation with Swish gating.
- **embedding lookup**: Direct vocabulary token embedding vector gathering.
- **logits sampling**: GPU-resident temperature, top-k, top-p, and min-p token selection.
- **KV-cache store**: Low-overhead key-value cache buffer insertion and rolling retention.
- **residual add**: In-place element-wise residual connection vector addition.
- **bias add**: Channel-wise and tensor-wise bias broadcasting.
- **buffer copy**: High-speed strided memory copy and tensor reshaping.
- **output sigmoid gate**: Calibrated logistic gating for output projection layers.
- **int8 weight-only quantized matmul**: Int8 quantized matrix multiplication with a bit-faithful CPU reference model.
- **kv_cache_defrag**: Paged attention memory defragmentation.
- **context_shift_register**: Sliding-window context register shifting.

### 3. Spiking Neural Networks (3 kernels)
- **spike correlation**: Pairwise spike-train synchrony and temporal firing correlation analysis.
- **leaky integrate-and-fire membrane update**: LIF membrane voltage integration with refractory threshold reset.
- **STDP weight/trace updates**: Spike-timing-dependent plasticity with dual exponential eligibility traces.

### 4. Recommendation and Knowledge Retrieval (5 kernels)
- **suggestion scoring**: Collaborative and content-based recommendation candidate scoring.
- **ranker preparation**: Feature collation and tensor preparation for ranking heads.
- **chain-boost accumulation**: Multi-hop graph link boosting and traversal weight accumulation.
- **GraphRAG dense vector similarity search**: In-memory dense cosine and dot-product vector search across graph node embeddings.
- **async host-to-GPU streaming pipeline**: Asynchronous zero-copy stream processing for the **Pixie** cognitive weaver and **BESS** swarm reasoner.

---

## Auto Device Detection, with a Manual Override

`DeviceCapabilityDetector` probes the installed GPU and picks the matching kernel target automatically, so `FitnessKernel.Create(device)` just works. 

When you need to pin a target:
- `KernelCatalog.SetDeviceTarget("bmg-g21")` overrides target selection at runtime.
- `KernelCatalog.LoadEmbeddedSpirv` can load a specific device's kernel directly from embedded resources.
- `KernelCatalog.EmbeddedDeviceTargets` discovers targets from what's actually embedded in the DLL, rather than a fixed list, so it stays correct as targets are added.

```csharp
// Discover targets dynamically embedded in the assembly
IReadOnlyList<string> targets = KernelCatalog.EmbeddedDeviceTargets;

// Pin to Battlemage Arc B580 explicitly
KernelCatalog.SetDeviceTarget("bmg-g21");

// Extract embedded SPIR-V binary directly
ReadOnlySpan<byte> spv = KernelCatalog.LoadEmbeddedSpirv("fitness_sphere", "bmg-g21");
```

---

## Supported Hardware Matrix

| Target ID | Architecture | Example Products / Silicon |
| :--- | :--- | :--- |
| `tgllp` | Gen12 | 11th Gen Intel Core Iris Xe |
| `dg1` | Gen12 | Iris Xe MAX discrete |
| `acm-g10 / g11 / g12` | Xe-HPG | Intel Arc A770, A750, A580, A380, A310 |
| `pvc` | Xe-HPC | Intel Data Center GPU Max (Ponte Vecchio) |
| `mtl` | Xe-LPG | Core Ultra 100 (Meteor Lake) |
| `arl-h` | Xe-LPG+ | Core Ultra 200 (Arrow Lake) |
| `bmg-g21` | Xe2-HPG | Intel Arc B580, B570 (Battlemage) |
| `lnl-m` | Xe2-LPG | Core Ultra 200V (Lunar Lake) |
| `ptl-h` | Xe3-LPG | Core Ultra 300 (Panther Lake) |

---

## Why This Exists

Getting a .NET application onto Intel GPU compute normally means hand-rolling SPIR-V, wiring up the Level Zero loader, and reimplementing device detection per target. 

LevelZero.NET does that work once, ships it precompiled, and gets out of the way. It backs HF Labs' own swarm optimizers, spiking-network simulators, local LLM runtime and GraphRAG retrieval, and it's built to be dropped into anything else that needs the same class of parallel kernel.

---

## Resources & Calls to Action

- [View on GitHub (HFLabs)](https://github.com/hf-laboratories)
- [Explore Product Page](/products/levelzero)
- [Contact Systems Engineering](/about#contact)
