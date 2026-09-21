---
title: "PowerShell Toolchain & DevOps Cmdlets"
description: "Automation scripts, kernel compilation audits, Level Zero hardware probes, and CI/CD operations."
category: "Tooling & DevOps"
order: 1
badge: "Automation"
tags: ["PowerShell", "pwsh", "Audit", "CI/CD", "Toolchain"]
---

# PowerShell Toolchain & DevOps Cmdlets

The HFLabs repository provides a suite of cross-platform PowerShell 7+ scripts for kernel verification, native driver testing, and hardware fabric orchestration.

## Core Toolchain Scripts

### 1. `Audit-SpvKernels.ps1`
Audits compiled SPIR-V binaries against OpenCL C kernel source manifests, verifying target ISA compatibility and checksums.
```powershell
pwsh -File src/HFLabs/Hardware/LevelZero.Toolchain/Audit-SpvKernels.ps1 -Verbose
```

### 2. `Test-LevelZeroAbi.ps1`
Runs low-level C ABI probe calls to verify Intel Level Zero driver loader compatibility on Windows and Linux hosts.
```powershell
pwsh -File src/HFLabs/Hardware/LevelZero.Toolchain/Test-LevelZeroAbi.ps1
```

### 3. `Build-KernelCatalog.ps1`
Invokes the Intel OpenCL Offline Compiler (`ioc64` / `ocloc`) to compile all 26 OpenCL C kernel sources to SPIR-V and native Zebin formats.
```powershell
pwsh -File src/HFLabs/Hardware/LevelZero.Toolchain/Build-KernelCatalog.ps1 -Target All
```

### 4. `Orchestrate-Fabric.ps1`
Heterogeneous cluster deployment script that discovers networked nodes, tests gRPC connectivity, and registers active workers with the Accelerator service.
```powershell
pwsh -File src/HFLabs/Hardware/Accelerator/Orchestrate-Fabric.ps1 -ClusterConfig cluster.json
```
