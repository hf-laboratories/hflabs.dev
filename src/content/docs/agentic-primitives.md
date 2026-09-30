---
title: "ML.Agentic & ML.Reasoning Primitives"
description: "21 zero-dependency building blocks, MCP, and A2A protocols for multi-agent systems and 5 graph-grounded reasoning engines."
category: "Machine Learning Suite"
order: 2
badge: "Released v1.0.0"
tags: ["Agentic", "Reasoning", "MCTS", "BDI", "Guardrails", "Releases"]
---

# ML.Agentic & ML.Reasoning Primitives

`ML.Agentic` and `ML.Reasoning` are open-core libraries providing standalone, zero-dependency architectural building blocks for multi-agent coordination, goal planning, and graph-grounded verification.

- **Status**: Released v1.0.0 (Production)
- **Product Page**: [Explore ML.Agentic Showcase](/products/ml-agentic)
- **GitHub Releases**: [Download Release Assets (v1.0.0)](https://github.com/hf-laboratories/ML.Agentic/releases/tag/v1.0.0)
- **Source Repository**: [github.com/hf-laboratories/ML.Agentic](https://github.com/hf-laboratories/ML.Agentic)

## Package Installation

```bash
# Add ML.Agentic to your .NET 10 project
dotnet add package HFLabs.ML.Agentic --version 1.0.0
```

## 22 ML.Agentic Primitives

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        22 ML.Agentic Primitives                         │
├───────────────────────┬─────────────────────────┬───────────────────────┤
│ Planning & Search     │ Reasoning & Verification│ Coordination & Routing│
│ • Hierarchical Planner│ • Reflection Loop       │ • Blackboard System   │
│ • MCTS Exploration    │ • Chain-of-Verification │ • Semantic Router     │
│ • Priority Scheduler  │ • Multi-Persona Debate  │ • Topology Manager    │
│ • Goal-Progress Mon.  │ • Program-Aided Reason. │ • Fallback Chain      │
│                       │ • Judge Evaluator       │ • Tool Registry       │
│                       │                         │ • Agent Cards Manifest│
├───────────────────────┴─────────────────────────┴───────────────────────┤
│ Safety, Memory & Adaptation                                             │
│ • Guardrail Pipeline  • Human-in-the-Loop Gate   • Resource Budget Ledger│
│ • Memory Bank (Epis.) • Context Compactor        • Evolutionary Mutator │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5 ML.Reasoning Graph Algorithms

These algorithms execute against any graph implementation conforming to `IKnowledgeGraph`:

1. **Multi-Hop Causal Path Reasoning**: Discovers directed causal inference chains with confidence decay calculations.
2. **Grounding Verifier**: Cross-checks agent claims against verified subgraphs, identifying unsupported assertions.
3. **TAPE Rollout Planning**: Predictive state rollout exploring action trajectories before committing execution steps.
4. **Belief-Desire-Intention (BDI) Engine**: Maintains formal agent world state, intention sets, and execution plans.
5. **Cognitive-Bias Detection & Debiasing**: Detects confirmation bias, anchoring heuristics, and availability bias in agent chains.

## Hardware Acceleration

`ML.Agentic` includes native hooks for optional hardware compute offload via [LevelZero.NET](/products/levelzero). When Intel GPU hardware is detected, semantic intent routing and property graph grounding queries execute via precompiled Level Zero SPIR-V kernels with sub-millisecond dispatch times.

## Resources & Links

- [ML.Agentic GitHub Releases](https://github.com/hf-laboratories/ML.Agentic/releases/tag/v1.0.0)
- [ML.Agentic Source Code](https://github.com/hf-laboratories/ML.Agentic)
- [Interactive Primitives Catalog](/products/ml-agentic)
- [Machine Learning Suite Overview](/products/ml-suite)

