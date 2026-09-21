---
title: "ML.Agentic & ML.Reasoning Primitives"
description: "22 dependency-free building blocks for multi-agent systems and 5 graph-grounded reasoning engines."
category: "Machine Learning Suite"
order: 2
badge: "Open Core"
tags: ["Agentic", "Reasoning", "MCTS", "BDI", "Guardrails"]
---

# ML.Agentic & ML.Reasoning Primitives

`ML.Agentic` and `ML.Reasoning` are open-core libraries providing standalone, zero-dependency architectural building blocks for multi-agent coordination, goal planning, and graph-grounded verification.

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
