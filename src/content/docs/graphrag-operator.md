---
title: "Hypertensor GraphRAG Operator Manual"
description: "Deploy, configure, and operate the in-memory Hypertensor GraphRAG engine, SIMD vector index, and FastMCP server."
category: "GraphRAG & Cognition"
order: 1
badge: "Active Development · Open-Core Planned"
tags: ["GraphRAG", "FastMCP", "SIMD", "BM25", "Vectors"]
---

# Hypertensor GraphRAG Operator Manual

**Hypertensor GraphRAG** is in active development, with production QA and rollout-gate validation underway. The planned model is open-core: the core release is intended to be public, while Pro and High-Assurance feature bundles remain private and licensed. Those bundles are not yet generally available. GraphRAG is an in-memory typed property-graph store designed for hybrid dense and BM25 search, multi-hop graph traversal, and agent integration through MCP.

## Architectural Highlights

- **In-Memory Property Graph**: Zero disk I/O during query execution; typed nodes and edges with attribute indices.
- **Hybrid Dense & BM25 Search**: Reciprocal Rank Fusion (RRF) combining dense vector embeddings with sparse BM25 inverted indices.
- **SIMD TensorPrimitives**: Vector distance computations (cosine, dot, L2) accelerated on CPU vector registers or Level Zero GPU.
- **LLM-Free Query Path**: Graph queries can run without a generative LLM call. Model-backed response generation is an optional layer.
- **FastMCP Protocol**: Standardized Model Context Protocol (MCP) server exposing tools, prompts, and resources to desktop HUDs and agent runners.

## Tested Scale and Current Quality Work

A tested in-memory graph configuration contains **1,000,000 nodes, 3,000,000 edges, and roughly 65,000 clusters**. In the current evaluation, prose was rated perfect in about 90% of cases. The running grounding score is currently 100% after a previously identified failing case was corrected. Advanced-query retrieval quality remains under active refinement, so these figures describe the current evaluation rather than a release guarantee.

## Quickstart Commands

### 1. Launch In-Memory GraphRAG Server
```bash
dotnet run --project src/HFLabs/Products/HypertensorGraphRAG/Server/Server.csproj -c Release
```

### 2. Run Headless Query
```bash
dotnet run --project src/HFLabs/Products/HypertensorGraphRAG/App/App.csproj -c Release -- --headless --query "Director"
```

### 3. Launch FastMCP SSE Bridge
```bash
python -m mcp_graphrag.server --transport sse --port 8000
```

## Configuration Options

Configure `appsettings.json` or environment variables:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `GraphRAG:DefaultVectorDimensions` | `128` | Default embedding vector dimensionality; configurable per store |
| `GraphRAG:EnableSimdVectorization` | `true` | Enable hardware SIMD vector operations |
| `GraphRAG:VectorOperationSetComposer:Enabled` | `false` | Enable vector operation-set composition |
| `GraphRAG:ServerUrl` | `http://localhost:5000` | GraphRAG server endpoint |

## FastMCP Tools Catalog

The built-in FastMCP server exposes over 65 tools for agent reasoning, including:

- `graph_query_nodes`: Retrieve nodes by type, property filters, or semantic proximity.
- `graph_find_paths`: Find shortest or lowest-cost causal paths between entity nodes.
- `graph_hybrid_search`: Execute combined BM25 and vector nearest-neighbor search.
- `graph_expand_subgraph`: Extract k-hop neighborhood ego-graphs for context injection.
- `graph_tri_beam_verify`: Verify entity candidate strings against graph token trie.
