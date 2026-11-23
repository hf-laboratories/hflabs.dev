---
title: "SwarmDev Pipeline and Components"
description: "A guide to SwarmDev planning, execution, host interfaces, and development status."
category: "Optimization & Swarms"
order: 2
badge: "In Development"
tags: ["SwarmDev", "Pipeline", "Director", "Scoped Change", "Graphing"]
---

# SwarmDev Pipeline and Components

SwarmDev is an in-development coding and research system in the IPUServices repository. Its engine includes deterministic classification, graph planning, action selection, normalization and response construction. Host and Director services expose additional orchestration and integration surfaces. Results depend on the chosen workflow, configured tools and providers, repository state, and validation; deterministic components do not make every external call or complete run deterministic.

## From request to response

The turn orchestrator follows a main path; scoped changes and inquiry have their own entry points and workflows:

1. **Classify** the prompt and choose a workflow family.
2. **Build graph context** and derive work items with candidate tools.
3. **Plan actions** under the action policy; a blocked plan stops before worklist execution.
4. **Execute work items** through the configured adapter and collect its results.
5. **Construct a response** and return the final workflow state, routing decision, action plan, work items, execution result, and response graph.

The default Host configuration uses a deterministic fallback adapter that can report synthetic success for unsupported work items. A successful fallback, plan, or validation label is not proof that a build, test, or edit ran. Token normalization and response gates are part of response construction; they should not be assumed to gate all work before execution.

## Major components

- **Engine and contracts:** classifiers, workflow selection, graph construction, action planning, worklist execution, normalization and response generation, with typed state and result models.
- **Analysis and scoped changes:** Roslyn analysis and a session-based workflow for defining focus, proposing changes, validating and applying a changeset, and recording outcomes and rollback artifacts. Review the actual outcome and diff; filesystem and rollback behavior need validation in the deployment's own configuration.
- **Host:** an ASP.NET Core service with health, A2A and MCP routes and workflow endpoints. It composes the engine and configured integrations.
- **Director:** a separate service for goal and multi-step orchestration over configured targets, with health, target, goal and event interfaces.
- **Graphing and response services:** codebase-graph operations, graph cutout resolution and frame-based response construction. Optional graph-reasoning and coherent-wavescan decorators augment configured cutout selection; they are not evidence of optimal routing.
- **Diagnostics and optional model escalation:** structured traces, work and validation results support inspection. Model escalation requires a configured backend; results and external service behavior are not guaranteed by deterministic routing.

Scientific inquiry, research-assistant, GraphRAG integration and related workflows have code, contracts and tests in the repository, but their presence alone does not establish live integration, answer quality or production acceptance.

## Repository entry points

From the IPUServices repository root, the engine is a library; it is not a `dotnet run` benchmark executable. The Host and Director are separate .NET 10 projects:

```powershell
# Build the engine library
dotnet build src/HFLabs/Products/SwarmDev/Engine/SwarmDev.csproj -c Release

# Run the SwarmDev test project
dotnet test src/HFLabs/Products/SwarmDev/tests/SwarmDev.Tests.csproj -c Release --nologo

# Start a configured host or director
dotnet run --project src/HFLabs/Products/SwarmDev/Host/SwarmDev.Host.csproj -c Release
dotnet run --project src/HFLabs/Products/SwarmDev/Director/SwarmDev.Director.csproj -c Release
```

These commands are starting points, not evidence of a passing run. The repository's host and Director configurations default to `http://localhost:5090` and `http://localhost:5091`, respectively; settings can change those addresses. Review authentication, provider credentials, target configuration and repository scope before starting or exposing services. Starting both processes does not establish a working Director-to-Host route. In the checked-in defaults, the Director targets the local host using A2A `message/send`, while the Host A2A dispatcher only supports `tasks/get` and rejects generic turn initiation. Verify the intended, explicitly authorized workflow and its actual transport end to end before use. The Director unattended policy is disabled by default, but requests without an unattended request ID follow a separate goal path; this setting does not block all goal execution. Do not point mutation workflows or destructive QA scenarios at a shared checkout.

## Validation and status

SwarmDev is private and in active development. Its repository includes tests for individual components, host routes, Director workflows and scoped changes. Those tests and the production QA checklist cover different evidence: a unit test, a completed worker, or a submitted plan is not the same as an end-to-end deployment test or release acceptance.

The scoped-change QA checklist calls for an identified candidate and configuration, a disposable repository for mutation and forced failures, before-and-after evidence, and explicit review of apply, validation and rollback outcomes. Unchecked checklist items are not passing evidence.
