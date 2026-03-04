# Swarm Bench High Scores

_Last updated: 2026-03-03_

This page tracks our swarm benchmark high scores, focused on:

1. **Lit Bench v4** results
2. The **360-dimension Sphere** run in the **1e-07** class

---

## Lit Bench v4 (2026-02-21)

**Source dataset:** `lit_bench_v4_20260221_221116`  
**Source summary:** `IPUServices/docs/benchmarks/fully-adaptive-vs-literature.md` (Version 4)

### Headline high scores

| Function | Dim | Best Error | Best Algorithm | Verdict |
|---|---:|---:|---|---|
| Sphere | 10D | 0.0 | PsoCmaEsHybrid | Matches |
| Sphere | 30D | 0.0 | CmaEs | Matches |
| Sphere | 50D | 8.28e-11 | GreyWolf (adaptive) | Exceeds |
| Rastrigin | 10D | 3.27e-11 | GreyWolf (adaptive) | Matches |
| Rastrigin | 30D | 4.67e-11 | GreyWolf (adaptive) | Exceeds |
| Rastrigin | 50D | 2.56e-11 | GreyWolf (adaptive) | Exceeds |
| Ackley | 10D | 1.18e-10 | GreyWolf (adaptive) | Matches |
| Ackley | 30D | 8.13e-11 | GreyWolf (adaptive) | Exceeds |
| Ackley | 50D | 8.22e-11 | GreyWolf (adaptive) | Exceeds |
| Griewank | 10D | 0.0 | PsoCmaEsHybrid | Matches |
| Griewank | 30D | 9.21e-11 | GreyWolf (adaptive) | Exceeds |
| Griewank | 50D | 5.51e-11 | GreyWolf (adaptive) | Exceeds |
| Levy | 10D | 7.58e-11 | CmaEs | Matches |
| Levy | 30D | 5.36e-11 | CmaEs | Exceeds |
| Levy | 50D | 3.19 | GreyWolf (adaptive) | Behind |
| Rosenbrock | 10D | 4.12 | CmaEs | Behind |
| Rosenbrock | 30D | 24.00 | CmaEs | Competitive |
| Rosenbrock | 50D | 41.71 | CmaEs | Exceeds |
| Schwefel | 10D | 2332 | GreyWolf (adaptive) | Behind |
| Schwefel | 30D | 9102 | GreyWolf (adaptive) | Behind |
| Schwefel | 50D | 17030 | GreyWolf (adaptive) | Behind |
| Zakharov | 10D | 4.33e-11 | GreyWolf (adaptive) | Exceeds |
| Zakharov | 30D | 8.57e-11 | CmaEs (pop=130) | Exceeds |
| Zakharov | 50D | 5.96e-07 | CmaEs (pop=180) | Behind |
| Michalewicz | 10D | 5.39 | GreyWolf (adaptive) | Behind |
| Michalewicz | 30D | 1.08 | GreyWolf (adaptive) | Competitive |
| Michalewicz | 50D | 1.57 | GreyWolf (adaptive) | Competitive |
| ZDT1/2/3 | 30D | 0.0 | AbcDeHybrid | Matches |

---

## 360D Sphere Run (1e-07 class)

**Run source:** `IPUServices/s360_gw_big.json`

| Metric | Value |
|---|---|
| Success | `true` |
| Algorithm | `GreyWolf` |
| Function | `Sphere Function` |
| Dimensions | `360` |
| Best Fitness | `1.1107845805920074e-07` |
| Error from Optimum | `1.1107845805920074e-07` |
| Population Size | `400` |
| Max Iterations | `3000` |
| Actual Iterations | `3000` |
| Elapsed Time | `205085 ms` (~205.1 s) |
| Pre-Scan Method | `WavefrontScanner` |
| Pre-Scan Regions Detected | `20` |

### Late-stage convergence checkpoints

| Iteration | Best Fitness |
|---:|---:|
| 2880 | 6.213915299450921e-07 |
| 2910 | 4.077521379414056e-07 |
| 2940 | 2.1995386190533582e-07 |
| 2970 | 1.1107845805920074e-07 |

This confirms the run finishes in the **1e-07** error class on 360D Sphere.
