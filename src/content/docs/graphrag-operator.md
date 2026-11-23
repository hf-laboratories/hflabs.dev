---
title: "Hypertensor GraphRAG Operator Guide"
description: "Explore the GraphRAG server, headless client, compact retrieval path, and FastMCP bridge."
category: "GraphRAG & Cognition"
order: 1
badge: "Active Development · Open-Core Planned"
tags: ["GraphRAG", "FastMCP", "SIMD", "Retrieval"]
---

# Hypertensor GraphRAG Operator Guide

Hypertensor GraphRAG is in active development. It brings together graph storage, retrieval, and operator interfaces for knowledge-graph workflows. The planned model is open-core; Pro and High-Assurance bundles remain private and are not generally available. Production QA and deployment validation are ongoing.

## Architecture

- **Named in-memory stores** support graph operations, retrieval, and topology workflows.
- **Compact retrieval** is a separate, read-oriented path over a selected ZIP corpus. Its fingerprinted layer cache is derived data that can be rebuilt; the ZIP remains the source of document content. Do not assume arbitrary graph mutation through this path.
- **Vector and text retrieval components** include CPU SIMD vector search and BM25. Available components do not establish that every query endpoint uses hybrid retrieval; verify the path and configuration for the workload.
- **Operator surfaces** include a Windows desktop HUD, a headless CLI, and an ASP.NET Core HTTP server. The CLI supervises or calls the server; it is not itself the API host.
- **FastMCP bridge** is a separate Python process that calls the HTTP server. Some agent workflows require configured providers and can return an unavailable response when those providers are missing.

Graph queries can run without a generative model, but retrieval quality and end-to-end behavior depend on the corpus, configuration, and chosen workflow. Validate the actual deployment and representative data before relying on it operationally.

## Getting started

The examples below run from the IPUServices repository root and require the .NET 10 SDK. The desktop app and its headless CLI target Windows. Set up a disposable data directory and review startup configuration before running a host; the default configuration enables several workspace bootstrap operations.

### 1. Launch the HTTP server

```powershell
dotnet run --project src/HFLabs/Products/HypertensorGraphRAG/Server/HFLabs.GraphRAG.Server.csproj -c Release
```

The default server URL is `http://localhost:5000`. Configure API and admin keys for non-development environments; the authentication middleware fails closed when required keys are absent. A deployment also needs its own access, networking, and security configuration.

### 2. Inspect the headless client

```powershell
dotnet run --project src/HFLabs/Products/HypertensorGraphRAG/App/HFLabs.GraphRAG.App.csproj -c Release -- --headless --help
```

With a configured server running, a query uses the `query` command:

```powershell
dotnet run --project src/HFLabs/Products/HypertensorGraphRAG/App/HFLabs.GraphRAG.App.csproj -c Release -- --headless query "Director"
```

The CLI also provides server lifecycle, store inspection, and onboarding commands. Use `--help` for current options; query results depend on the selected store and its contents.

### 3. Install and run the MCP bridge

```powershell
pip install -e src/HFLabs/Products/HypertensorGraphRAG/MCPHost
python -m mcp_graphrag.server --transport sse --port 8000
```

The bridge supports `stdio`, `sse`, and `streamable-http`; `--bundle` can restrict the mounted tools. Configure the backend URL and credentials in the bridge process environment as needed. The server remains the authorization authority.

## Selected configuration

The server's `appsettings.json` defines these settings. Environment variables can override nested keys with `__` separators.

| Setting | Default | Purpose |
| :--- | :--- | :--- |
| `GraphRAG:SingleOwner:ServerUrl` | `http://localhost:5000` | HTTP server URL |
| `GraphRAG:DefaultVectorDimensions` | `128` | Default dimensions for new vector stores |
| `GraphRAG:EnableSimdVectorization` | `true` | Enables SIMD vectorization when applicable |
| `GraphRAG:VectorOperationSetComposer:Enabled` | `false` | Enables vector operation-set composition |

For the MCP bridge, `GRAPHRAG_BACKEND_URL` selects the backend, while `GRAPHRAG_API_KEY` and `GRAPHRAG_CLEARANCE_TOKEN` supply credentials when required. Keep credentials in protected process configuration.

## Validation scope

The repository includes focused tests for compact-store behavior, endpoint/client behavior, and KGE-based topology deduplication. These establish evidence only at their executed scope. The product QA plan calls for separate checks of a built server from another process, representative data, operational configuration, and desktop packaging. A passing unit test or synthetic graph result alone does not establish production readiness or real-world retrieval quality.
