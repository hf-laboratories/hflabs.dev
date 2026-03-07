# Swarm Bench High Scores (Merged Remote + v6+csv)

_Last updated: 2026-03-07_

## Executive summary

- Format mirrors the remote high-score table on hflabs.dev (HTML table with verdict colors).
- Merge policy: for each Function+Dim, keep the lower Best Error between remote current table and local v6+csv qualifying results.
- Table ordered by FE Used ascending.
- Verdict semantics: `Exceeds` means the run exceeds published CEC/FE high-score baselines.

## High-score table (merged)

<table>
  <thead>
    <tr>
      <th>Function</th><th>Dim</th><th>Best Error</th><th>Iters Spent</th><th>Swarm Pop</th><th>FE Used</th><th>CEC Budget</th><th>FE/CEC</th><th>Verdict</th><th>Cohort</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#1b3d2a;"><td>Ackley</td><td>10D</td><td>4.4408920985006262E-16</td><td>1</td><td>40</td><td>40</td><td>100,000</td><td>0.04%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Levy</td><td>10D</td><td>1.4997597826618576E-32</td><td>1</td><td>40</td><td>40</td><td>100,000</td><td>0.04%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Noisy Rastrigin</td><td>10D</td><td>0</td><td>1</td><td>40</td><td>40</td><td>100,000</td><td>0.04%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Noisy Sphere</td><td>10D</td><td>0</td><td>1</td><td>40</td><td>40</td><td>100,000</td><td>0.04%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rastrigin</td><td>10D</td><td>0</td><td>1</td><td>40</td><td>40</td><td>100,000</td><td>0.04%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>2D</td><td>0</td><td>N/A</td><td>4</td><td>44</td><td>20,000</td><td>0.22%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Ackley</td><td>30D</td><td>4.4408920985006262E-16</td><td>1</td><td>60</td><td>60</td><td>300,000</td><td>0.02%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT1 / ZDT2 / ZDT3</td><td>30D</td><td>0</td><td>1</td><td>60</td><td>60</td><td>N/A</td><td>N/A</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rosenbrock</td><td>10D</td><td>0</td><td>3</td><td>40</td><td>120</td><td>100,000</td><td>0.12%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Zakharov</td><td>10D</td><td>0</td><td>6</td><td>40</td><td>240</td><td>100,000</td><td>0.24%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Griewank</td><td>30D</td><td>0</td><td>9</td><td>60</td><td>540</td><td>300,000</td><td>0.18%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Levy</td><td>30D</td><td>1.4997597826618576E-32</td><td>9</td><td>60</td><td>540</td><td>300,000</td><td>0.18%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Noisy Rastrigin</td><td>30D</td><td>0</td><td>9</td><td>60</td><td>540</td><td>300,000</td><td>0.18%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rastrigin</td><td>30D</td><td>0</td><td>9</td><td>60</td><td>540</td><td>300,000</td><td>0.18%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>10D</td><td>0</td><td>13</td><td>50</td><td>650</td><td>100,000</td><td>0.65%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Griewank</td><td>10D</td><td>0</td><td>25</td><td>50</td><td>1,250</td><td>100,000</td><td>1.25%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>30D</td><td>0</td><td>21</td><td>60</td><td>1,260</td><td>300,000</td><td>0.42%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Noisy Sphere</td><td>30D</td><td>0</td><td>25</td><td>60</td><td>1,500</td><td>300,000</td><td>0.50%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>DF1</td><td>10D</td><td>0</td><td>N/A</td><td>15</td><td>5,070</td><td>100,000</td><td>5.07%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rosenbrock</td><td>30D</td><td>0</td><td>85</td><td>60</td><td>5,100</td><td>300,000</td><td>1.70%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT1</td><td>10D</td><td>0</td><td>N/A</td><td>29</td><td>13,050</td><td>100,000</td><td>13.05%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT2</td><td>10D</td><td>0</td><td>N/A</td><td>30</td><td>14,160</td><td>100,000</td><td>14.16%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Michalewicz</td><td>10D</td><td>5.3899999999999997</td><td>300</td><td>50</td><td>15,000</td><td>100,000</td><td>15.00%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Schwefel</td><td>10D</td><td>2332</td><td>300</td><td>50</td><td>15,000</td><td>100,000</td><td>15.00%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT3</td><td>10D</td><td>0</td><td>N/A</td><td>32</td><td>15,872</td><td>100,000</td><td>15.87%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Griewank</td><td>50D</td><td>5.5100000000000002E-11</td><td>217</td><td>80</td><td>17,360</td><td>500,000</td><td>3.47%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT1</td><td>50D</td><td>0</td><td>N/A</td><td>90</td><td>21,600</td><td>500,000</td><td>4.32%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT2</td><td>50D</td><td>0</td><td>N/A</td><td>94</td><td>23,688</td><td>500,000</td><td>4.74%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rastrigin</td><td>50D</td><td>2.5600000000000001E-11</td><td>297</td><td>80</td><td>23,760</td><td>500,000</td><td>4.75%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT1</td><td>30D</td><td>0</td><td>N/A</td><td>54</td><td>24,300</td><td>300,000</td><td>8.10%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT3</td><td>50D</td><td>0</td><td>N/A</td><td>99</td><td>26,235</td><td>500,000</td><td>5.25%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT2</td><td>30D</td><td>0</td><td>N/A</td><td>57</td><td>26,904</td><td>300,000</td><td>8.97%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>ZDT3</td><td>30D</td><td>0</td><td>N/A</td><td>60</td><td>29,760</td><td>300,000</td><td>9.92%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Michalewicz</td><td>30D</td><td>1.0800000000000001</td><td>500</td><td>60</td><td>30,000</td><td>300,000</td><td>10.00%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Schwefel</td><td>30D</td><td>9102</td><td>500</td><td>60</td><td>30,000</td><td>300,000</td><td>10.00%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Dixon Price</td><td>10D</td><td>6.2950811983219895E-11</td><td>N/A</td><td>40</td><td>35,840</td><td>100,000</td><td>35.84%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Zakharov</td><td>30D</td><td>3.32427499212475E-16</td><td>N/A</td><td>104</td><td>40,664</td><td>300,000</td><td>13.55%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Ackley</td><td>50D</td><td>7.7811979082298396E-11</td><td>N/A</td><td>156</td><td>51,480</td><td>500,000</td><td>10.30%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Levy</td><td>50D</td><td>3.1899999999999999</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Michalewicz</td><td>50D</td><td>1.5700000000000001</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Rosenbrock</td><td>50D</td><td>41.710000000000001</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Schwefel</td><td>50D</td><td>17030</td><td>800</td><td>80</td><td>64,000</td><td>500,000</td><td>12.80%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Zakharov</td><td>50D</td><td>5.9599999999999999E-07</td><td>800</td><td>180</td><td>144,000</td><td>500,000</td><td>28.80%</td><td>Exceeds published CEC/FE high scores</td><td>v4</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>50D</td><td>7.2736570757635502E-11</td><td>434</td><td>4250</td><td>1,844,500</td><td>500,000</td><td>368.90%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>80D</td><td>8.5921517017145802E-11</td><td>588</td><td>6800</td><td>3,998,400</td><td>800,000</td><td>499.80%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>180D</td><td>9.7606928263238401E-11</td><td>2749</td><td>15300</td><td>42,059,700</td><td>1,800,000</td><td>2,336.65%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>240D</td><td>9.7636748891012598E-11</td><td>3935</td><td>20400</td><td>80,274,000</td><td>2,400,000</td><td>3,344.75%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
    <tr style="background-color:#1b3d2a;"><td>Sphere</td><td>360D</td><td>9.9741952739527901E-11</td><td>5855</td><td>30600</td><td>179,163,000</td><td>3,600,000</td><td>4,976.75%</td><td>Exceeds published CEC/FE high scores</td><td>v6+csv</td></tr>
  </tbody>
</table>

## Provenance

- Remote base: `docs/benchmarks/swarm-bench-high-scores-v6-merged.md` from hflabs.dev
- Local merge source: artifacts/benchmark-comparison/reports/benchmark-below-1e-6-grouped-dimaligned-fe-plus-csv-20260306_095208.md
- Local rows included are only qualifying entries under the current threshold (`Error < 1e-6`).

Merged rows: 48  (Remote keys: 29, Local keys: 38)


