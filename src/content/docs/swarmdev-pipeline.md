---
title: "SwarmDev Deterministic Pipeline"
description: "Turn natural language into inspectable, testable execution plans across 6 explicit stages with diagnostic sidecars."
category: "Optimization & Swarms"
order: 2
badge: "Deterministic"
tags: ["SwarmDev", "Pipeline", "kGNN", "Deterministic", "Telemetry"]
---

# SwarmDev Deterministic Pipeline

**SwarmDev** is a deterministic prompt-to-workflow compilation pipeline. It transforms unstructured natural-language requests into fully verifiable, inspectable execution plans backed by an immutable diagnostic trail.

## 6-Stage Deterministic Flow

```
[Prompt] ──> (1. Classify) ──> (2. Analyze) ──> (3. Graph)
                                                  │
[Execution Plan] <── (6. Emit) <── (5. Normalize) <── (4. Route)
```

1. **Classify**: Determines request category, execution archetype, domain boundaries, and required capability entitlements.
2. **Analyze**: Extracts formal parameter schemas, constraints, preconditions, and invariant specifications.
3. **Graph**: Constructs an in-memory knowledge representation of required tasks and causal dependencies.
4. **Route**: Dispatches sub-tasks to specialized domain frames, tool contracts, or accelerator targets.
5. **Normalize**: Policy-gated validation verifying safety, budget limits, cycle freedom, and schema adherence.
6. **Emit**: Produces a fully typed, topologically sorted, execution-ready plan envelope.

## Running SwarmDev Benchmarks

```bash
dotnet run --project src/HFLabs/Products/SwarmDev/SwarmDev.csproj -c Release -- run-benchmarks
```

## Optional Extension Layers

- **kGNN Graph Reasoning**: Opt-in graph neural network module evaluating non-local structural dependencies across complex plans.
- **HyperSwarm Wavescan Bridge**: Performs swarm-guided parameter exploration to discover optimal pipeline routing paths.
- **Structured Telemetry Sidecar**: Captures latency, step outputs, and rule evaluation traces at each stage for 100% auditability.
