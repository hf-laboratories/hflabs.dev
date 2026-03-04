# Swarm Bench High Scores

_Last updated: 2026-03-03_

This page tracks swarm benchmark highs with a strict provenance rule: every value must map to a recorded run artifact.

---

## Executive summary

- **Lit Bench v4** remains the base benchmark set for this page (`lit_bench_v4_20260221_221116`).
- The table now includes **iterations spent**, **swarm population**, **FE used**, and **CEC budget** (plus FE/CEC ratio).
- The previously separate **Sphere 360D (1e-07 class)** result is now integrated directly into the main table.
- The main table intentionally **drops algorithm names** (as requested) because runs were executed in fully adaptive mode; algorithm usage spread is reported separately by iteration-share ratio.
- For single-objective v4 rows, FE/CEC ranges from **0.42% to 28.80%**; the standalone 360D Sphere run is **33.33%** FE/CEC.

---

## High-score table (with budgets)

**Primary source cohort:** `training_results/lit_bench_v4_20260221_221116/summary.csv`  
**Integrated 360D row source:** `s360_gw_big.json` (standalone run, not one of the 44 v4 sweep rows)

| Function | Dim | Best Error | Iters Spent | Swarm Pop | FE Used | CEC Budget | FE/CEC | Verdict | Cohort |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Sphere | 10D | 0.0 | 13 | 50 | 650 | 100,000 | 0.65% | Matches | v4 |
| Sphere | 30D | 0.0 | 21 | 60 | 1,260 | 300,000 | 0.42% | Matches | v4 |
| Sphere | 50D | 8.28e-11 | 225 | 80 | 18,000 | 500,000 | 3.60% | Exceeds | v4 |
| Sphere | 360D | 1.1107845805920074e-07 | 3000 | 400 | 1,200,000 | 3,600,000 | 33.33% | Recorded (1e-07 class) | standalone |
| Rastrigin | 10D | 3.27e-11 | 97 | 50 | 4,850 | 100,000 | 4.85% | Matches | v4 |
| Rastrigin | 30D | 4.67e-11 | 196 | 60 | 11,760 | 300,000 | 3.92% | Exceeds | v4 |
| Rastrigin | 50D | 2.56e-11 | 297 | 80 | 23,760 | 500,000 | 4.75% | Exceeds | v4 |
| Ackley | 10D | 1.18e-10 | 300 | 50 | 15,000 | 100,000 | 15.00% | Matches | v4 |
| Ackley | 30D | 8.13e-11 | 231 | 60 | 13,860 | 300,000 | 4.62% | Exceeds | v4 |
| Ackley | 50D | 8.22e-11 | 353 | 80 | 28,240 | 500,000 | 5.65% | Exceeds | v4 |
| Griewank | 10D | 0.0 | 25 | 50 | 1,250 | 100,000 | 1.25% | Matches | v4 |
| Griewank | 30D | 9.21e-11 | 151 | 60 | 9,060 | 300,000 | 3.02% | Exceeds | v4 |
| Griewank | 50D | 5.51e-11 | 217 | 80 | 17,360 | 500,000 | 3.47% | Exceeds | v4 |
| Levy | 10D | 7.58e-11 | 133 | 50 | 6,650 | 100,000 | 6.65% | Matches | v4 |
| Levy | 30D | 5.36e-11 | 281 | 60 | 16,860 | 300,000 | 5.62% | Exceeds | v4 |
| Levy | 50D | 3.19 | 800 | 80 | 64,000 | 500,000 | 12.80% | Behind | v4 |
| Rosenbrock | 10D | 4.12 | 300 | 50 | 15,000 | 100,000 | 15.00% | Behind | v4 |
| Rosenbrock | 30D | 24.00 | 500 | 60 | 30,000 | 300,000 | 10.00% | Competitive | v4 |
| Rosenbrock | 50D | 41.71 | 800 | 80 | 64,000 | 500,000 | 12.80% | Exceeds | v4 |
| Schwefel | 10D | 2332 | 300 | 50 | 15,000 | 100,000 | 15.00% | Behind | v4 |
| Schwefel | 30D | 9102 | 500 | 60 | 30,000 | 300,000 | 10.00% | Behind | v4 |
| Schwefel | 50D | 17030 | 800 | 80 | 64,000 | 500,000 | 12.80% | Behind | v4 |
| Zakharov | 10D | 4.33e-11 | 82 | 50 | 4,100 | 100,000 | 4.10% | Exceeds | v4 |
| Zakharov | 30D | 8.57e-11 | 500 | 130 | 65,000 | 300,000 | 21.67% | Exceeds | v4 |
| Zakharov | 50D | 5.96e-07 | 800 | 180 | 144,000 | 500,000 | 28.80% | Behind | v4 |
| Michalewicz | 10D | 5.39 | 300 | 50 | 15,000 | 100,000 | 15.00% | Behind | v4 |
| Michalewicz | 30D | 1.08 | 500 | 60 | 30,000 | 300,000 | 10.00% | Competitive | v4 |
| Michalewicz | 50D | 1.57 | 800 | 80 | 64,000 | 500,000 | 12.80% | Competitive | v4 |
| ZDT1 / ZDT2 / ZDT3 | 30D | 0.0 | 1 | 60 | 60 | N/A | N/A | Matches | v4 |

> Budget formulas: **FE = Swarm Pop × Iters Spent**; **CEC Budget = 10,000 × D** (single-objective CEC baseline).

---

## Fully-adaptive algorithm usage spread (iteration-share ratio)

This section keeps algorithm visibility without putting algorithm names back in the main high-score table.

Computed from all successful rows in `lit_bench_v4_20260221_221116/summary.csv`:

- **Total runs:** 44
- **Total actual iterations across runs:** 15,192

| Algorithm | Runs | Total Iters | Iter-share ratio |
|---|---:|---:|---:|
| GreyWolf | 27 | 10,145 | 66.78% |
| CmaEs | 9 | 4,135 | 27.22% |
| AbcDeHybrid | 5 | 478 | 3.15% |
| PsoCmaEsHybrid | 3 | 434 | 2.86% |

---

## Notes on cohort scope

- Rows marked **v4** are taken from the Lit Bench v4 sweep.
- The **Sphere 360D** row is a standalone benchmark integration from `s360_gw_big.json`, included here for continuity with the previously requested 1e-07-class run.
