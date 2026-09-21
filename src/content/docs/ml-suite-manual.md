---
title: "HFLabs Machine Learning Suite"
description: "Hyperparameter optimization, knowledge graph embeddings, local Level Zero LLM inference, and SNN simulation in .NET."
category: "Machine Learning Suite"
order: 1
badge: "Local ML Stack"
tags: ["ML Suite", "HPO", "KGE", "Level Zero LLM", "SNN"]
---

# HFLabs Machine Learning Suite

The **HFLabs Machine Learning Suite** provides composable, dependency-free .NET libraries for model tuning, knowledge graph representation learning, local LLM execution, and neuromorphic spiking networks—with zero cloud services in the loop.

## Core Modules

### 1. Hyperparameter Optimization (HPO)
A resumable optimization framework built around disk-checkpointed sessions:
- **5 Search Algorithms**: Bayesian Optimization (Gaussian Process surrogate), Hyperband, BOHB, ASHA-BOHB, and TuRBO (Trust-Region Bayesian Optimization).
- **JSON Checkpoints**: Searches survive power loss or system restarts seamlessly.
- **Continuous, Integer & Categorical** parameters with early-stopping criteria.

### 2. Knowledge Graph Embeddings (KGE)
- **6 Scoring Functions**: `TransE`, `RotatE`, `ComplEx`, `DistMult`, `ZPinch-TransE` (anchors schema roots near origin), and `Dual-Conjugate ComplEx` (inverse relations).
- **Dual Hardware Acceleration**: SIMD CPU TensorPrimitives + Poplar-native IPU engine.
- **Auto-Extractors**: Generate graphs from codebases, database schemas, architectural plans, skill files, and white papers.

### 3. Local LLM Inference (Level Zero)
- From-scratch transformer runtime in pure C# / .NET 10.
- Native Hugging Face `.safetensors` loader, BPE tokenizer, and Qwen chat templating.
- Full decoder layers, RoPE embeddings, linear attention, and dynamic KV-cache.
- Direct Intel Level Zero GPU offload with companion `l0llm` CLI tool.

### 4. Graph-Constrained Decoding
- Tri-beam decoder synchronizing beam candidates against knowledge graph entity boundaries.
- Token trie constructed over graph entities prevents hallucinations by construction during token generation.

### 5. Spiking Neural Networks (SNN)
- Reference CPU simulator for neuromorphic experiments.
- Leaky Integrate-and-Fire (LIF) neuron groups, event-driven spike scheduling, refractory periods, and Spike-Timing-Dependent Plasticity (STDP).
