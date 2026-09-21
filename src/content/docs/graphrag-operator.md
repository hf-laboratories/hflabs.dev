---
title: "Hypertensor GraphRAG Operator Manual"
description: "Deploy, configure, and operate the in-memory Hypertensor GraphRAG engine, SIMD vector index, and FastMCP server."
category: "GraphRAG & Cognition"
order: 1
badge: "Production Ready"
tags: ["GraphRAG", "FastMCP", "SIMD", "BM25", "Vectors"]
---

# Hypertensor GraphRAG Operator Manual

**Hypertensor GraphRAG** is an in-memory typed property-graph store designed for sub-millisecond retrieval, hybrid dense and BM25 search, and multi-hop graph traversal. It bridges directly to AI agents via a 65+ tool **FastMCP** server.

## Architectural Highlights

- **In-Memory Property Graph**: Zero disk I/O during query execution; typed nodes and edges with attribute indices.
- **Hybrid Dense & BM25 Search**: Reciprocal Rank Fusion (RRF) combining dense vector embeddings with sparse BM25 inverted indices.
- **SIMD TensorPrimitives**: Vector distance computations (cosine, dot, L2) accelerated on CPU vector registers or Level Zero GPU.
- **FastMCP Protocol**: Standardized Model Context Protocol (MCP) server exposing tools, prompts, and resources to desktop HUDs and agent runners.

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
| `GraphRAG:VectorDimensions` | `1536` | Embedding vector dimensionality |
| `GraphRAG:SIMDAcceleration` | `true` | Enable hardware SIMD TensorPrimitives |
| `GraphRAG:BM25:k1` | `1.2` | BM25 term frequency saturation parameter |
| `GraphRAG:BM25:b` | `0.75` | BM25 document length normalization parameter |
| `GraphRAG:MaxHopDepth` | `4` | Maximum multi-hop graph exploration depth |
| `FastMCP:Port` | `8000` | Port for FastMCP SSE / HTTP endpoint |

## FastMCP Tools Catalog

The built-in FastMCP server exposes over 65 tools for agent reasoning, including:

- `graph_query_nodes`: Retrieve nodes by type, property filters, or semantic proximity.
- `graph_find_paths`: Find shortest or lowest-cost causal paths between entity nodes.
- `graph_hybrid_search`: Execute combined BM25 and vector nearest-neighbor search.
- `graph_expand_subgraph`: Extract k-hop neighborhood ego-graphs for context injection.
- `graph_tri_beam_verify`: Verify entity candidate strings against graph token trie.
