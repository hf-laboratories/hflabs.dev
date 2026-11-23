---
title: "AutoMLApp Canvas & Tabular Guide"
description: "An in-development Windows canvas workbench with a bundle-based tabular ML workflow."
category: "Optimization & Swarms"
order: 3
badge: "In Development"
tags: ["AutoMLApp", "Canvas", "Tabular", "WinForms", ".NET 10"]
---

# AutoMLApp Canvas & Tabular Guide

**AutoMLApp** is a Windows desktop canvas workbench built with .NET 10 and WinForms. The host loads capability bundles, including a Tabular bundle for local ML.NET training. Other bundles and integrations are at different stages of development; the presence of a canvas surface does not imply that every underlying workflow or hardware target is ready for use.

## Tabular workflow

The Tabular bundle provides Data Source, Transform, Model, Evaluator, and Output steps, with typed dataset and model connections. It supports CSV/TSV input, model training and optional trainer or hyperparameter search, run history, and saved artifacts. Validation checks required configuration, upstream inputs, malformed transforms, and cycles.

1. Open a Tabular quickstart or search template, or create a pipeline on the canvas.
2. Configure the data source, label, model, and other steps. A Pipeline zone scopes the steps in that workflow.
3. Select **Run Pipeline** or press **F5**. Use **Shift+F5** to stop. The Runs tray shows the recorded results.
4. Review the run and model artifacts. Canvas documents use the `.canvas.md` format.

The Tabular execution path is implemented, but the application's production QA checklist still requires release evidence and acceptance checks. Some broader stage-progression and hardware-tile telemetry surfaces are simulated; the telemetry-first AutoML engine is a proof of concept. Tabular runs have their own recorded status and results.

## Launch AutoMLApp

From the repository root on a supported Windows development machine:

```powershell
dotnet run --project src/HFLabs/Products/AutoMLApp/AutoMLApp.csproj -c Release
```

The application is in development. Bundle availability depends on the installed configuration and entitlements.
