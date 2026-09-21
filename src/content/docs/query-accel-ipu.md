---
title: "IPU SQL Acceleration & Poplar.NET"
description: "Hardware-accelerated database queries, PostgreSQL extensions, and Poplar.NET managed driver shims."
category: "Hardware & Substrates"
order: 3
badge: "Database & IPU"
tags: ["IPU", "SQL", "PostgreSQL", "Poplar.NET", "CLR"]
---

# IPU SQL Acceleration & Poplar.NET

The **IPU Query Acceleration** suite offloads relational aggregations and vector similarity operations from database engines directly to Graphcore Colossus IPU hardware.

## Subsystem Components

1. **PostgreSQL C Extension**: Intercepts aggregation query trees and vector operators (`<->`, `<=>`), packaging batch data into gRPC plan envelopes.
2. **SQL Server CLR Bridge**: Managed .NET assembly linking SQL Server user-defined aggregates and table functions to the Accelerator daemon.
3. **Poplar.NET Driver Shim**: Managed C# wrapper providing safe native handles to Graphcore Poplar/PopART graph compilation and engine sessions.

## Benchmark & Driver Invocations

### 1. Run IPU Query Acceleration Benchmark
```bash
dotnet run --project src/HFLabs/Products/QueryAccel/QueryAccel.csproj -c Release -- --benchmark
```

### 2. Test Poplar.NET Driver Lifecycle
```bash
dotnet run --project src/HFLabs/Hardware/Poplar.NET/PoplarDriver.csproj -c Release
```

## Offloaded Operations

- **Relational Aggregations**: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` executed in parallel across thousands of IPU SRAM tiles.
- **Vector Distance Metrics**: Cosine similarity, Euclidean (L2) distance, and inner product for dense embedding indices.
