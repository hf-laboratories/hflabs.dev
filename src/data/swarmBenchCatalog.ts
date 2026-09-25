// src/data/swarmBenchCatalog.ts
// Catalog of the 110 test functions and CLI commands in SwarmBench

export interface BenchmarkFunction {
  id: string;
  name: string;
  category: "Unimodal" | "Multimodal" | "Constrained" | "Multi-objective" | "Combinatorial" | "Dynamic" | "Niching" | "Noisy" | "High-dimensional";
  categoryKey: "unimodal" | "multimodal" | "constrained" | "multi_objective" | "combinatorial" | "dynamic" | "niching" | "noisy" | "high_dimensional";
  dimensions: number;
  knownOptimum: string;
  notes?: string;
  objectives?: number;
  noiseLevel?: number;
}

export const BENCHMARK_CATEGORIES = [
  { key: "all", label: "ALL FUNCTIONS", count: 110, color: "#38bdf8" },
  { key: "unimodal", label: "UNIMODAL", count: 9, color: "#00e5ff" },
  { key: "multimodal", label: "MULTIMODAL", count: 23, color: "#818cf8" },
  { key: "constrained", label: "CONSTRAINED", count: 25, color: "#f59e0b" },
  { key: "multi_objective", label: "MULTI-OBJECTIVE", count: 16, color: "#84cc16" },
  { key: "combinatorial", label: "COMBINATORIAL", count: 12, color: "#ec4899" },
  { key: "dynamic", label: "DYNAMIC", count: 8, color: "#f43f5e" },
  { key: "niching", label: "NICHING", count: 9, color: "#a855f7" },
  { key: "noisy", label: "NOISY", count: 6, color: "#06b6d4" },
  { key: "high_dimensional", label: "HIGH-D", count: 2, color: "#10b981" }
] as const;

export const BENCHMARK_COMMANDS = [
  {
    cmd: "list-functions, list-algorithms",
    desc: "Print the test-function and algorithm catalogues as JSON",
    syntax: "SwarmBenchmarkRunner list-functions --json",
    category: "Discovery"
  },
  {
    cmd: "run",
    desc: "Run one benchmark with the chosen algorithm and function",
    syntax: "SwarmBenchmarkRunner run --algorithm pso --function rosenbrock --dimensions 10 --iterations 500 --seed 42",
    category: "Execution"
  },
  {
    cmd: "run-full",
    desc: "Run with telemetry and optional feature layers",
    syntax: "SwarmBenchmarkRunner run-full --algorithm gwo --function ackley --features topology,hotspots",
    category: "Execution"
  },
  {
    cmd: "run-stream",
    desc: "Emit real-time JSON telemetry on standard output, with a configurable sample interval",
    syntax: "SwarmBenchmarkRunner run-stream --algorithm fa --function rastrigin --sample-interval-ms 16",
    category: "Telemetry"
  },
  {
    cmd: "run-diagnostic",
    desc: "Write a per-agent, per-iteration JSONL trace for replay and analysis",
    syntax: "SwarmBenchmarkRunner run-diagnostic --algorithm mopso --function zdt1 --out trace.jsonl",
    category: "Diagnostics"
  },
  {
    cmd: "run-game",
    desc: "Run a multi-stage elimination tournament across the test-function gamut, with survivor and election fractions, replicas and optional subswarm splitting",
    syntax: "SwarmBenchmarkRunner run-game --pool 50 --survivors 0.5 --split-subswarms --backend levelzero",
    category: "Tournament"
  },
  {
    cmd: "run-convergence-benchmark",
    desc: "Compare three search strategies, GlobalGrid, Beeline and Wavefront-1Iter, under an evaluation budget",
    syntax: "SwarmBenchmarkRunner run-convergence-benchmark --function sphere --budget 800",
    category: "Analysis"
  },
  {
    cmd: "run-convergence-benchmark-matrix",
    desc: "Sweep several budgets (default 200, 400, 800, 1600) and print a compact winner table per function",
    syntax: "SwarmBenchmarkRunner run-convergence-benchmark-matrix --budgets 200,400,800,1600",
    category: "Analysis"
  },
  {
    cmd: "run-hpo-sweep",
    desc: "Run an ASHA/BOHB-driven hyperparameter sweep with cached results",
    syntax: "SwarmBenchmarkRunner run-hpo-sweep --algorithm pso_de --budget-type evaluations",
    category: "Tuning"
  },
  {
    cmd: "train",
    desc: "Train swarm configurations per test function, filtered by category or dimension bin",
    syntax: "SwarmBenchmarkRunner train --category multimodal --dimension-bin 10d",
    category: "Training"
  },
  {
    cmd: "high-dim-bench",
    desc: "Run seeded high-dimensional benchmark expansions",
    syntax: "SwarmBenchmarkRunner high-dim-bench --dimensions 100,200,500 --seed 42",
    category: "Scaling"
  },
  {
    cmd: "hypercache-export, hypercache-validate, hypercache-validate-recall",
    desc: "Export and validate the HyperCache of tuned configurations",
    syntax: "SwarmBenchmarkRunner hypercache-validate --check-recall",
    category: "Cache"
  }
];

export const BENCHMARK_FUNCTIONS: BenchmarkFunction[] = [
  // --- UNIMODAL (9) ---
  { id: "sphere", name: "Sphere", category: "Unimodal", categoryKey: "unimodal", dimensions: 30, knownOptimum: "0", notes: "Continuous, convex, isotropic bowl" },
  { id: "rosenbrock", name: "Rosenbrock", category: "Unimodal", categoryKey: "unimodal", dimensions: 10, knownOptimum: "0", notes: "Banana valley, non-separable gradient flow" },
  { id: "zakharov", name: "Zakharov", category: "Unimodal", categoryKey: "unimodal", dimensions: 10, knownOptimum: "0", notes: "Non-separable quadratic with power term" },
  { id: "dixonprice", name: "Dixon-Price", category: "Unimodal", categoryKey: "unimodal", dimensions: 10, knownOptimum: "0", notes: "Valley with quadratic index scaling" },
  { id: "booth", name: "Booth", category: "Unimodal", categoryKey: "unimodal", dimensions: 2, knownOptimum: "0", notes: "Plate-shaped quadratic benchmark" },
  { id: "bent_cigar", name: "Bent Cigar", category: "Unimodal", categoryKey: "unimodal", dimensions: 10, knownOptimum: "0", notes: "Extremely conditioned ill-scaled ridge" },
  { id: "powell", name: "Powell", category: "Unimodal", categoryKey: "unimodal", dimensions: 24, knownOptimum: "0", notes: "Quartic non-differentiable singularity" },
  { id: "hyper_ellipsoid", name: "Rotated Hyper-Ellipsoid", category: "Unimodal", categoryKey: "unimodal", dimensions: 10, knownOptimum: "0", notes: "Cumulative sum coordinate axes" },
  { id: "sum_of_diff_powers", name: "Sum of Different Powers", category: "Unimodal", categoryKey: "unimodal", dimensions: 10, knownOptimum: "0", notes: "Variable exponent steepness" },

  // --- MULTIMODAL (23) ---
  { id: "rastrigin", name: "Rastrigin", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Cosine lattice of local traps" },
  { id: "ackley", name: "Ackley", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Nearly flat outer region with deep hole" },
  { id: "griewank", name: "Griewank", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Product of cosine terms on parabola" },
  { id: "schwefel", name: "Schwefel", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Deceptive optimum at search space boundary" },
  { id: "levy", name: "Levy", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Sinusoidal modulation with sharp basin" },
  { id: "michalewicz", name: "Michalewicz", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "-9.66", notes: "Steep valleys with factorial basin count" },
  { id: "beale", name: "Beale", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "0", notes: "Sharp corner ridges" },
  { id: "goldstein_price", name: "Goldstein-Price", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "3", notes: "Eighth-order polynomial landscape" },
  { id: "bukin_n6", name: "Bukin N.6", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "0", notes: "Thin parabolic canyon with ripple waves" },
  { id: "eggholder", name: "Eggholder", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "-959.6407", notes: "Extreme multimodality with chaotic basins" },
  { id: "cross_in_tray", name: "Cross-in-Tray", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "-2.0626", notes: "Cross-shaped ridge with 4 global corners" },
  { id: "drop_wave", name: "Drop-Wave", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "-1", notes: "Concentric circular ripple oscillations" },
  { id: "easom", name: "Easom", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "-1", notes: "Microscopic basin surrounded by flat plane" },
  { id: "styblinski_tang", name: "Styblinski-Tang", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "-391.6617", notes: "Quartic double-well per dimension" },
  { id: "schaffer_n2", name: "Schaffer N.2", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "0", notes: "Circular ripple bands" },
  { id: "schaffer_n4", name: "Schaffer N.4", category: "Multimodal", categoryKey: "multimodal", dimensions: 2, knownOptimum: "0.292579", notes: "Asymmetric concentric ring barrier" },
  { id: "alpine", name: "Alpine N.1", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Absolute sine product peaks" },
  { id: "salomon", name: "Salomon", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Radial wave rings around origin" },
  { id: "hartmann3", name: "Hartmann 3D", category: "Multimodal", categoryKey: "multimodal", dimensions: 3, knownOptimum: "-3.86278", notes: "4 local minima in unit hypercube" },
  { id: "hartmann6", name: "Hartmann 6D", category: "Multimodal", categoryKey: "multimodal", dimensions: 6, knownOptimum: "-3.32237", notes: "6 local minima with non-linear exponential matrix" },
  { id: "happy_cat", name: "Happy Cat", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Curved valley with steep surrounding walls" },
  { id: "expanded_griewank_rosenbrock", name: "Expanded Griewank-Rosenbrock", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Nested Griewank cosine ripple inside Rosenbrock valley" },
  { id: "weierstrass", name: "Weierstrass", category: "Multimodal", categoryKey: "multimodal", dimensions: 10, knownOptimum: "0", notes: "Continuous everywhere, differentiable nowhere fractal" },

  // --- CONSTRAINED (25) ---
  { id: "g01", name: "G01", category: "Constrained", categoryKey: "constrained", dimensions: 13, knownOptimum: "-15", notes: "CEC 2006, 9 linear inequality constraints" },
  { id: "g02", name: "G02", category: "Constrained", categoryKey: "constrained", dimensions: 20, knownOptimum: "-0.803619", notes: "CEC 2006, 2 non-linear inequalities" },
  { id: "g03", name: "G03", category: "Constrained", categoryKey: "constrained", dimensions: 10, knownOptimum: "-1", notes: "CEC 2006, 1 non-linear equality constraint" },
  { id: "g04", name: "G04", category: "Constrained", categoryKey: "constrained", dimensions: 5, knownOptimum: "-30665.539", notes: "CEC 2006, 6 non-linear inequalities" },
  { id: "g05", name: "G05", category: "Constrained", categoryKey: "constrained", dimensions: 4, knownOptimum: "5126.4981", notes: "CEC 2006, cubic equality constraints" },
  { id: "g06", name: "G06", category: "Constrained", categoryKey: "constrained", dimensions: 2, knownOptimum: "-6961.81388", notes: "CEC 2006, cubic inequality constraint" },
  { id: "g07", name: "G07", category: "Constrained", categoryKey: "constrained", dimensions: 10, knownOptimum: "24.3062", notes: "CEC 2006, 8 non-linear inequalities" },
  { id: "g08", name: "G08", category: "Constrained", categoryKey: "constrained", dimensions: 2, knownOptimum: "-0.095825", notes: "CEC 2006, 2 non-linear inequality boundaries" },
  { id: "g09", name: "G09", category: "Constrained", categoryKey: "constrained", dimensions: 7, knownOptimum: "680.6301", notes: "CEC 2006, 4 non-linear inequality constraints" },
  { id: "g10", name: "G10", category: "Constrained", categoryKey: "constrained", dimensions: 8, knownOptimum: "7049.3307", notes: "CEC 2006, linear and cubic inequalities" },
  { id: "g11", name: "G11", category: "Constrained", categoryKey: "constrained", dimensions: 2, knownOptimum: "0.7499", notes: "CEC 2006, quadratic equality constraint" },
  { id: "g12", name: "G12", category: "Constrained", categoryKey: "constrained", dimensions: 3, knownOptimum: "-1", notes: "CEC 2006, 729 disjoint feasible sub-spheres" },
  { id: "g13", name: "G13", category: "Constrained", categoryKey: "constrained", dimensions: 5, knownOptimum: "0.0539498", notes: "CEC 2006, 3 non-linear equality constraints" },
  { id: "g14", name: "G14", category: "Constrained", categoryKey: "constrained", dimensions: 10, knownOptimum: "-47.7649", notes: "CEC 2006, 3 linear equality constraints" },
  { id: "g15", name: "G15", category: "Constrained", categoryKey: "constrained", dimensions: 3, knownOptimum: "961.715", notes: "CEC 2006, 2 equality constraints" },
  { id: "g16", name: "G16", category: "Constrained", categoryKey: "constrained", dimensions: 5, knownOptimum: "-1.9051553", notes: "CEC 2006, 38 linear/quadratic inequalities" },
  { id: "g17", name: "G17", category: "Constrained", categoryKey: "constrained", dimensions: 6, knownOptimum: "8853.5396", notes: "CEC 2006, 4 non-linear equality constraints" },
  { id: "g18", name: "G18", category: "Constrained", categoryKey: "constrained", dimensions: 9, knownOptimum: "-0.8660254", notes: "CEC 2006, 13 non-linear inequality constraints" },
  { id: "g19", name: "G19", category: "Constrained", categoryKey: "constrained", dimensions: 15, knownOptimum: "32.6555929", notes: "CEC 2006, 5 non-linear equality constraints" },
  { id: "g21", name: "G21", category: "Constrained", categoryKey: "constrained", dimensions: 7, knownOptimum: "193.7245", notes: "CEC 2006, linear and non-linear equalities" },
  { id: "g23", name: "G23", category: "Constrained", categoryKey: "constrained", dimensions: 9, knownOptimum: "-400.0551", notes: "CEC 2006, 6 inequalities, 2 equalities" },
  { id: "g24", name: "G24", category: "Constrained", categoryKey: "constrained", dimensions: 2, knownOptimum: "-5.508", notes: "CEC 2006, 2 non-linear inequalities" },
  { id: "pressure_vessel", name: "Pressure Vessel Design", category: "Constrained", categoryKey: "constrained", dimensions: 4, knownOptimum: "6059.714", notes: "Engineering benchmark: Ts, Th, R, L design" },
  { id: "tension_compression_spring", name: "Tension/Compression Spring Design", category: "Constrained", categoryKey: "constrained", dimensions: 3, knownOptimum: "0.0126652", notes: "Engineering benchmark: wire dia, mean coil dia, active coils" },
  { id: "welded_beam", name: "Welded Beam Design", category: "Constrained", categoryKey: "constrained", dimensions: 4, knownOptimum: "1.7249", notes: "Engineering benchmark: weld thickness, length, bar depth, width" },

  // --- MULTI-OBJECTIVE (16) ---
  { id: "zdt1", name: "ZDT1", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 30, objectives: 2, knownOptimum: "Pareto Front [0, 1]", notes: "Convex Pareto optimal front" },
  { id: "zdt2", name: "ZDT2", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 30, objectives: 2, knownOptimum: "Pareto Front [0, 1]", notes: "Non-convex Pareto optimal front" },
  { id: "zdt3", name: "ZDT3", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 30, objectives: 2, knownOptimum: "Discontinuous Front", notes: "5 disconnected Pareto optimal curves" },
  { id: "dtlz1", name: "DTLZ1", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 7, objectives: 3, knownOptimum: "Linear Hyperplane", notes: "11^k - 1 local Pareto fronts" },
  { id: "dtlz2", name: "DTLZ2", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 12, objectives: 3, knownOptimum: "Spherical Sector", notes: "Spherical Pareto frontier" },
  { id: "dtlz3", name: "DTLZ3", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 12, objectives: 3, knownOptimum: "Spherical with Traps", notes: "DTLZ2 front surrounded by dense local traps" },
  { id: "dtlz4", name: "DTLZ4", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 12, objectives: 3, knownOptimum: "Biased Front", notes: "Parametric density bias along coordinate axes" },
  { id: "dtlz5", name: "DTLZ5", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 12, objectives: 3, knownOptimum: "Degenerate Curve", notes: "Degenerate 1D curve in 3D objective space" },
  { id: "dtlz6", name: "DTLZ6", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 12, objectives: 3, knownOptimum: "Extremely Degenerate", notes: "Severe bias testing frontier dimensionality reduction" },
  { id: "dtlz7", name: "DTLZ7", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 22, objectives: 3, knownOptimum: "Disconnected Regions", notes: "2^(M-1) disconnected Pareto optimal regions" },
  { id: "dtlz1_m5", name: "DTLZ1 (many-objective)", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 9, objectives: 5, knownOptimum: "5D Linear Hyperplane", notes: "Many-objective 5D linear simplex" },
  { id: "dtlz2_m5", name: "DTLZ2 (many-objective)", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 14, objectives: 5, knownOptimum: "5D Spherical Octant", notes: "Many-objective 5D spherical sector" },
  { id: "dtlz7_m5", name: "DTLZ7 (many-objective)", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 24, objectives: 5, knownOptimum: "5D Disconnected Fronts", notes: "Many-objective 16 disconnected Pareto regions" },
  { id: "dtlz3_m8", name: "DTLZ3 (many-objective)", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 17, objectives: 8, knownOptimum: "8D Spherical Hypersurface", notes: "8-objective extreme multimodal traps" },
  { id: "dtlz4_m10", name: "DTLZ4 (many-objective)", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 19, objectives: 10, knownOptimum: "10D Biased Manifold", notes: "10-objective dense boundary bias" },
  { id: "dtlz5_m15", name: "DTLZ5 (many-objective)", category: "Multi-objective", categoryKey: "multi_objective", dimensions: 24, objectives: 15, knownOptimum: "15D Degenerate Manifold", notes: "15-objective high-dimensional manifold test" },

  // --- COMBINATORIAL (12) ---
  { id: "tsp_benchmark", name: "TSP Benchmark (Continuous)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 10, knownOptimum: "Global Shortest Tour", notes: "Continuous relaxation encoding of TSP" },
  { id: "tsp_medium", name: "TSP (Medium)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 30, knownOptimum: "Fixed Seed Tour", notes: "30-city seeded Euclidean permutation" },
  { id: "tsp_high", name: "TSP (High)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 100, knownOptimum: "Fixed Seed Tour", notes: "100-city seeded Euclidean permutation" },
  { id: "tsp_very_high", name: "TSP (Very High)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 200, knownOptimum: "Fixed Seed Tour", notes: "200-city large-scale route optimization" },
  { id: "qap_benchmark", name: "QAP Benchmark (Continuous)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 10, knownOptimum: "Optimal Facility Layout", notes: "Quadratic Assignment Problem 10 facilities" },
  { id: "qap_medium", name: "QAP (Medium)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 30, knownOptimum: "Fixed Seed Assignment", notes: "30 facilities, distance x flow tensor" },
  { id: "qap_high", name: "QAP (High)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 100, knownOptimum: "Fixed Seed Assignment", notes: "100 facilities, large-scale assignment" },
  { id: "qap_very_high", name: "QAP (Very High)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 200, knownOptimum: "Fixed Seed Assignment", notes: "200 facilities high-dimensional permutation" },
  { id: "knapsack", name: "0/1 Knapsack Problem", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 20, knownOptimum: "Max Value Subset", notes: "20 items, weight capacity constraint" },
  { id: "knapsack_medium", name: "Knapsack (Medium)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 30, knownOptimum: "Fixed Seed Max Value", notes: "30 items with correlated weights" },
  { id: "knapsack_high", name: "Knapsack (High)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 100, knownOptimum: "Fixed Seed Max Value", notes: "100 items strongly correlated profits" },
  { id: "knapsack_very_high", name: "Knapsack (Very High)", category: "Combinatorial", categoryKey: "combinatorial", dimensions: 200, knownOptimum: "Fixed Seed Max Value", notes: "200 items high-dimensional knapsack" },

  // --- DYNAMIC (8) ---
  { id: "moving_peaks", name: "Moving Peaks", category: "Dynamic", categoryKey: "dynamic", dimensions: 5, knownOptimum: "Dynamic Peak", notes: "5 moving cone peaks shifting in coordinate space" },
  { id: "moving_peaks_medium", name: "Moving Peaks (Medium)", category: "Dynamic", categoryKey: "dynamic", dimensions: 30, knownOptimum: "Dynamic Peak", notes: "8 peaks, changes every 3,000 evaluations" },
  { id: "moving_peaks_high", name: "Moving Peaks (High)", category: "Dynamic", categoryKey: "dynamic", dimensions: 100, knownOptimum: "Dynamic Peak", notes: "10 peaks, changes every 5,000 evaluations" },
  { id: "moving_peaks_very_high", name: "Moving Peaks (Very High)", category: "Dynamic", categoryKey: "dynamic", dimensions: 200, knownOptimum: "Dynamic Peak", notes: "12 peaks, changes every 7,000 evaluations" },
  { id: "peaks_5", name: "Moving Peaks Niching (5 peaks)", category: "Dynamic", categoryKey: "dynamic", dimensions: 5, knownOptimum: "Dynamic Niche", notes: "Changes every 5,000 evaluations" },
  { id: "peaks_10", name: "Moving Peaks Niching (10 peaks)", category: "Dynamic", categoryKey: "dynamic", dimensions: 5, knownOptimum: "Dynamic Niche", notes: "Changes every 5,000 evaluations" },
  { id: "peaks_20", name: "Moving Peaks Niching (20 peaks)", category: "Dynamic", categoryKey: "dynamic", dimensions: 5, knownOptimum: "Dynamic Niche", notes: "Changes every 5,000 evaluations" },
  { id: "df1", name: "DF1 Dynamic Function", category: "Dynamic", categoryKey: "dynamic", dimensions: 10, knownOptimum: "Time-Varying Center", notes: "CEC dynamic benchmark; the optimum position shifts over time" },

  // --- NICHING (9) ---
  { id: "equal_maxima", name: "Equal Maxima", category: "Niching", categoryKey: "niching", dimensions: 1, knownOptimum: "1.0 (5 equal peaks)", notes: "5 identical height sinusoidal peaks" },
  { id: "five_uneven_peak_trap", name: "Five Uneven Peak Trap", category: "Niching", categoryKey: "niching", dimensions: 1, knownOptimum: "1.0 (Global)", notes: "1 global peak and 4 deceptive sub-peaks" },
  { id: "uneven_decreasing_maxima", name: "Uneven Decreasing Maxima", category: "Niching", categoryKey: "niching", dimensions: 1, knownOptimum: "1.0 (Exponential Decay)", notes: "Exponentially attenuated peak heights" },
  { id: "himmelblau", name: "Himmelblau's Function", category: "Niching", categoryKey: "niching", dimensions: 2, knownOptimum: "0 (4 global minima)", notes: "4 identical global optima at symmetric coordinates" },
  { id: "six_hump_camel_back", name: "Six-Hump Camel Back", category: "Niching", categoryKey: "niching", dimensions: 2, knownOptimum: "-1.0316 (2 global)", notes: "2 global and 4 local minima" },
  { id: "shubert", name: "Shubert", category: "Niching", categoryKey: "niching", dimensions: 2, knownOptimum: "-186.7309 (18 global)", notes: "18 global and 742 local minima" },
  { id: "shubert_nd", name: "Shubert N-D", category: "Niching", categoryKey: "niching", dimensions: 5, knownOptimum: "High-Dimensional Niches", notes: "Exponentially exploding niche grid" },
  { id: "vincent", name: "Vincent", category: "Niching", categoryKey: "niching", dimensions: 2, knownOptimum: "1.0 (36 global peaks)", notes: "6^D = 36 global peaks with non-uniform spacing" },
  { id: "modified_rastrigin_niching", name: "Modified Rastrigin, all global optima", category: "Niching", categoryKey: "niching", dimensions: 2, knownOptimum: "0 (Multiple Global)", notes: "Modulated Rastrigin equalizing all local peaks" },

  // --- NOISY (6) ---
  { id: "noisy_sphere", name: "Noisy Sphere", category: "Noisy", categoryKey: "noisy", dimensions: 30, knownOptimum: "0", noiseLevel: 0.1, notes: "Gaussian noise sigma = 0.1 on evaluation" },
  { id: "noisy_sphere_high", name: "Noisy Sphere (High)", category: "Noisy", categoryKey: "noisy", dimensions: 100, knownOptimum: "0", noiseLevel: 0.1, notes: "100-dimensional noisy parabolic bowl" },
  { id: "noisy_sphere_very_high", name: "Noisy Sphere (Very High)", category: "Noisy", categoryKey: "noisy", dimensions: 200, knownOptimum: "0", noiseLevel: 0.1, notes: "200-dimensional noisy parabolic bowl" },
  { id: "noisy_rastrigin", name: "Noisy Rastrigin", category: "Noisy", categoryKey: "noisy", dimensions: 10, knownOptimum: "0", noiseLevel: 0.05, notes: "Multimodal traps + stochastic jitter sigma = 0.05" },
  { id: "noisy_rastrigin_high", name: "Noisy Rastrigin (High)", category: "Noisy", categoryKey: "noisy", dimensions: 100, knownOptimum: "0", noiseLevel: 0.1, notes: "100D multimodal traps with evaluation noise" },
  { id: "noisy_rastrigin_very_high", name: "Noisy Rastrigin (Very High)", category: "Noisy", categoryKey: "noisy", dimensions: 200, knownOptimum: "0", noiseLevel: 0.1, notes: "200D multimodal traps with evaluation noise" },

  // --- HIGH-DIMENSIONAL (2) ---
  { id: "highdim_sphere_low", name: "High-D Sphere (Low)", category: "High-dimensional", categoryKey: "high_dimensional", dimensions: 10, knownOptimum: "0", notes: "Seed expansion baseline (scales to 10,000D)" },
  { id: "highdim_rastrigin_medium", name: "High-D Rastrigin (Medium)", category: "High-dimensional", categoryKey: "high_dimensional", dimensions: 30, knownOptimum: "0", notes: "Multimodal seed expansion (scales to 5,000D)" }
];

export const VISUALIZER_LAYERS = [
  {
    layer: "Agents",
    icon: "🐝",
    color: "#00e5ff",
    description: "Position, velocity, fitness, personal best, age, neighbour count, agent type, subswarm and algorithm mode"
  },
  {
    layer: "Subswarms",
    icon: "👑",
    color: "#818cf8",
    description: "Parent and child links, depth, best fitness, stagnation count, active, grown or converged status"
  },
  {
    layer: "Topology Regions",
    icon: "🌐",
    color: "#10b981",
    description: "Centre, estimated radius, average fitness, fitness contrast, deflection count, region type"
  },
  {
    layer: "Feature Planes",
    icon: "📐",
    color: "#f59e0b",
    description: "Strength, confidence, urgency, activation height, suggested operation and preferred mode"
  },
  {
    layer: "Hotspots",
    icon: "🔥",
    color: "#f43f5e",
    description: "Centroid, strength, average fitness, observation count"
  },
  {
    layer: "Metrics",
    icon: "📊",
    color: "#ec4899",
    description: "Named values with units, sampled as the run goes (convergence rate, diversity entropy, velocity variance)"
  }
];

export const LIFECYCLE_STAGES = [
  { stage: "01", name: "Run Started", desc: "Seed initialization, domain boundary allocation, and initial particle dispersion." },
  { stage: "02", name: "Topology Scan", desc: "Neighbourhood graph computation, communication adjacency matrices, and cluster seeds." },
  { stage: "03", name: "Iteration", desc: "Synchronous or asynchronous velocity, position, and fitness evaluations." },
  { stage: "04", name: "Improvement", desc: "Global or Pareto frontier advancement, pBest updates, and historical record tracking." },
  { stage: "05", name: "Convergence", desc: "Stagnation detection, entropy variance monitoring, and threshold verification." },
  { stage: "06", name: "Event", desc: "Subswarm split/merge, dynamic peak shift, obstacle encounter, or replica exchange." },
  { stage: "07", name: "Run Completed", desc: "Final metric telemetry aggregation, HyperCache writeback, and profile generation." }
];
