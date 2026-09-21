---
title: "ABIGen C/C++ Binding Synthesizer"
description: "libclang-driven generator that parses C/C++ headers and synthesizes C ABI shims and safe C# P/Invoke bindings."
category: "Hardware & Substrates"
order: 4
badge: "DevTools"
tags: ["ABIGen", "libclang", "C#", "P/Invoke", "Native"]
---

# ABIGen C/C++ Binding Synthesizer

**ABIGen** is a code generation toolkit driven by `libclang` that parses native C and C++ header files, analyzes API surfaces, and generates clean C ABI shims alongside safe, type-strict C# bindings.

## Generation Workflow

```
[C/C++ Headers] ──> (libclang AST Analysis) ──> (Policy & Type Mapper)
                                                       │
[Safe C# P/Invoke Bindings] <── [C ABI Shim .c/.h] <──┘
```

1. **AST Extraction**: Traverses header files via `libclang`, extracting function signatures, structs, enums, and typedefs.
2. **Unsupported API Detection**: Identifies C++ virtual tables, complex templates, and compiler-specific extensions requiring ABI flattening.
3. **C ABI Shim Generation**: Synthesizes flat, `extern "C"` wrapper functions with explicit calling conventions (`cdecl`, `stdcall`).
4. **C# Binding Synthesis**: Emits managed C# classes with `LibraryImport` / `DllImport`, safe handle lifetimes, and marshalling attributes.

## Running ABIGen

```bash
dotnet run --project src/HFLabs/DevTools/ABIGen/ABIGen.csproj -- --config abigen-poplar.json --generate-bindings
```
