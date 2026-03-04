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

**Verdict color legend**
- <span style="display:inline-block;width:12px;height:12px;background:#1b324a;border-radius:2px;vertical-align:middle;"></span> Matches
- <span style="display:inline-block;width:12px;height:12px;background:#1b3d2a;border-radius:2px;vertical-align:middle;"></span> Exceeds
- <span style="display:inline-block;width:12px;height:12px;background:#4a3a1b;border-radius:2px;vertical-align:middle;"></span> Competitive
- <span style="display:inline-block;width:12px;height:12px;background:#4a1f1f;border-radius:2px;vertical-align:middle;"></span> Behind
- <span style="display:inline-block;width:12px;height:12px;background:#2b234f;border-radius:2px;vertical-align:middle;"></span> Recorded (1e-07 class)

<table>
  <thead>
    <tr>
      <th>Function</th>
      <th>Dim</th>
      <th>Best Error</th>
      <th>Iters Spent</th>
      <th>Swarm Pop</th>
      <th>FE Used</th>
      <th>CEC Budget</th>
      <th>FE/CEC</th>
      <th>Verdict</th>
      <th>Cohort</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#1b324a;"><td>Sphere</td><td>10D</td><td>0.0</td><td>13</td><td>50</td><td>650</td><td>100,000</td><td>0.65%</td><td>Matches</td><td>v4</td></tr>
    <tr style="background-color:#1b324a;"><td>Sphere</td><td>30D</td><td>0.0</td><td>21</td><td>60</td><td>1,260</td><td>300,000</td><td>0.42%</td><td>Matches</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>50D</td><td>8.28e-11</td><td>225</td><td>80</td><td>18,000</td><td>500,000</td><td>3.60%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#2b234f;"><td>Sphere</td><td>360D</td><td>1.1107845805920074e-07</td><td>3000</td><td>400</td><td>1,200,000</td><td>3,600,000</td><td>33.33%</td><td>Recorded (1e-07 class)</td><td>standalone</td></tr>
    <tr style="background-color:#1b324a;"><td>Rastrigin</td><td>10D</td><td>3.27e-11</td><td>97</td><td>50</td><td>4,850</td><td>100,000</td><td>4.85%</td><td>Matches</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rastrigin</td><td>30D</td><td>4.67e-11</td><td>196</td><td>60</td><td>11,760</td><td>300,000</td><td>3.92%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rastrigin</td><td>50D</td><td>2.56e-11</td><td>297</td><td>80</td><td>23,760</td><td>500,000</td><td>4.75%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b324a;"><td>Ackley</td><td>10D</td><td>1.18e-10</td><td>300</td><td>50</td><td>15,000</td><td>100,000</td><td>15.00%</td><td>Matches</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Ackley</td><td>30D</td><td>8.13e-11</td><td>231</td><td>60</td><td>13,860</td><td>300,000</td><td>4.62%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Ackley</td><td>50D</td><td>8.22e-11</td><td>353</td><td>80</td><td>28,240</td><td>500,000</td><td>5.65%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b324a;"><td>Griewank</td><td>10D</td><td>0.0</td><td>25</td><td>50</td><td>1,250</td><td>100,000</td><td>1.25%</td><td>Matches</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Griewank</td><td>30D</td><td>9.21e-11</td><td>151</td><td>60</td><td>9,060</td><td>300,000</td><td>3.02%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Griewank</td><td>50D</td><td>5.51e-11</td><td>217</td><td>80</td><td>17,360</td><td>500,000</td><td>3.47%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b324a;"><td>Levy</td><td>10D</td><td>7.58e-11</td><td>133</td><td>50</td><td>6,650</td><td>100,000</td><td>6.65%</td><td>Matches</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Levy</td><td>30D</td><td>5.36e-11</td><td>281</td><td>60</td><td>16,860</td><td>300,000</td><td>5.62%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Levy</td><td>50D</td><td>3.19</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Rosenbrock</td><td>10D</td><td>4.12</td><td>300</td><td>50</td><td>15,000</td><td>100,000</td><td>15.00%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#4a3a1b;"><td>Rosenbrock</td><td>30D</td><td>24.00</td><td>500</td><td>60</td><td>30,000</td><td>300,000</td><td>10.00%</td><td>Competitive</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rosenbrock</td><td>50D</td><td>41.71</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Schwefel</td><td>10D</td><td>2332</td><td>300</td><td>50</td><td>15,000</td><td>100,000</td><td>15.00%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Schwefel</td><td>30D</td><td>9102</td><td>500</td><td>60</td><td>30,000</td><td>300,000</td><td>10.00%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Schwefel</td><td>50D</td><td>17030</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Zakharov</td><td>10D</td><td>4.33e-11</td><td>82</td><td>50</td><td>4,100</td><td>100,000</td><td>4.10%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Zakharov</td><td>30D</td><td>8.57e-11</td><td>500</td><td>130</td><td>65,000</td><td>300,000</td><td>21.67%</td><td>Exceeds</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Zakharov</td><td>50D</td><td>5.96e-07</td><td>800</td><td>180</td><td>144,000</td><td>500,000</td><td>28.80%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#4a1f1f;"><td>Michalewicz</td><td>10D</td><td>5.39</td><td>300</td><td>50</td><td>15,000</td><td>100,000</td><td>15.00%</td><td>Behind</td><td>v4</td></tr>
    <tr style="background-color:#4a3a1b;"><td>Michalewicz</td><td>30D</td><td>1.08</td><td>500</td><td>60</td><td>30,000</td><td>300,000</td><td>10.00%</td><td>Competitive</td><td>v4</td></tr>
    <tr style="background-color:#4a3a1b;"><td>Michalewicz</td><td>50D</td><td>1.57</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Competitive</td><td>v4</td></tr>
    <tr style="background-color:#1b324a;"><td>ZDT1 / ZDT2 / ZDT3</td><td>30D</td><td>0.0</td><td>1</td><td>60</td><td>60</td><td>N/A</td><td>N/A</td><td>Matches</td><td>v4</td></tr>
  </tbody>
</table>

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
