// src/data/swarmAtlas.ts
// Comprehensive catalog of the 35 verified swarm & metaheuristic optimizers in HyperSwarm

export interface SwarmAlgorithmTile {
  id: string;
  code: string;
  name: string;
  category: "CORE SWARM" | "HYBRID METAHEURISTICS" | "ADVANCED METAHEURISTICS" | "MULTI-OBJECTIVE";
  categoryKey: "core" | "hybrid" | "advanced" | "mo";
  color: string;
  glowColor: string;
  subTitle: string;
  description: string;
  formula: string;
  parameters: { name: string; default: string; desc: string }[];
  gpuKernel: string;
  csharpSignature: string;
  visualType: "orbits" | "pheromones" | "hexgrid" | "echolocation" | "pack" | "school" | "luminescence" | "luciferin" | "levy" | "vectors3d" | "oscillators" | "hybrid_pso_de" | "hybrid_pso_gwo" | "hybrid_pso_aco" | "hybrid_pso_fa" | "hybrid_pso_sa" | "hybrid_pso_ts" | "hybrid_pso_cmaes" | "hybrid_abc_de" | "hybrid_aco_ga" | "hybrid_bco_pso" | "hybrid_de_sqp" | "hybrid_fa_cs" | "hybrid_gwo_woa" | "hybrid_memetic" | "bats_beacons" | "ils" | "map_elites" | "tempering" | "grasp" | "lagrangian" | "aug_lagrangian" | "mopso" | "nsga3" | "moswarm";
}

export const SWARM_CATEGORIES = [
  { key: "all", label: "ALL OPTIMIZERS", count: 35, color: "#94a3b8" },
  { key: "core", label: "CORE SWARM", count: 11, color: "#00e5ff", glow: "rgba(0, 229, 255, 0.4)" },
  { key: "hybrid", label: "HYBRIDS", count: 14, color: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },
  { key: "advanced", label: "ADVANCED", count: 7, color: "#f43f5e", glow: "rgba(244, 63, 94, 0.4)" },
  { key: "mo", label: "MULTI-OBJECTIVE", count: 3, color: "#84cc16", glow: "rgba(132, 204, 22, 0.4)" }
] as const;

export const SWARM_ATLAS: SwarmAlgorithmTile[] = [
  // ==========================================
  // --- SECTION 1: CORE SWARM ALGORITHMS (11) ---
  // ==========================================
  {
    id: "pso",
    code: "PSO",
    name: "PARTICLE SWARM OPTIMIZATION",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Classical & Inertia PSO",
    description: "Classical and inertia-weighted velocity update models. Particles navigate search spaces guided by personal cognitive memory (pBest) and collective social attractor (gBest).",
    formula: "v_{i}(t+1) = w v_{i}(t) + c_1 r_1 (pBest_i - x_i(t)) + c_2 r_2 (gBest - x_i(t))",
    parameters: [
      { name: "w (Inertia)", default: "0.7298", desc: "Clerck constriction factor momentum balance" },
      { name: "c1 (Cognitive)", default: "1.49618", desc: "Acceleration coefficient pulling toward pBest" },
      { name: "c2 (Social)", default: "1.49618", desc: "Acceleration coefficient pulling toward gBest" }
    ],
    gpuKernel: "pso_velocity.cl (LevelZero SPIR-V SIMD32)",
    csharpSignature: "var optimizer = new ParticleSwarmOptimizer(popSize: 256, dim: 64, options);",
    visualType: "orbits"
  },
  {
    id: "aco",
    code: "ACO",
    name: "ANT COLONY OPTIMIZATION",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Pheromone Path Construction",
    description: "Probabilistic tour and permutation synthesis driven by artificial pheromone trails and heuristic visibility metrics with global evaporation.",
    formula: "P_{ij}^k = \\frac{[\\tau_{ij}]^\\alpha [\\eta_{ij}]^\\beta}{\\sum_{l \\in \\mathcal{N}_i^k} [\\tau_{il}]^\\alpha [\\eta_{il}]^\\beta}",
    parameters: [
      { name: "alpha (Pheromone)", default: "1.0", desc: "Pheromone trail importance exponent" },
      { name: "beta (Heuristic)", default: "2.5", desc: "Heuristic distance visibility exponent" },
      { name: "rho (Evaporation)", default: "0.05", desc: "Pheromone decay rate per iteration" }
    ],
    gpuKernel: "aco_transition.cl, pairwise_distance.cl",
    csharpSignature: "var aco = new AntColonyOptimizer(nodes: 512, alpha: 1.0f, beta: 2.5f, rho: 0.05f);",
    visualType: "pheromones"
  },
  {
    id: "bco",
    code: "BCO",
    name: "ARTIFICIAL BEE COLONY",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Employed & Onlooker Foraging",
    description: "Three distinct bee foraging roles: employed bees search nectar sources, onlooker bees allocate attention proportionally to nectar quality, and scout bees discover unvisited basins.",
    formula: "v_{ij} = x_{ij} + \\phi_{ij} (x_{ij} - x_{kj}), \\quad \\phi_{ij} \\in [-1, 1]",
    parameters: [
      { name: "EmployedCount", default: "pop / 2", desc: "Half colony assigned to active food sources" },
      { name: "Limit", default: "100", desc: "Max abandonment trials before scout triggering" },
      { name: "PhiScale", default: "1.0", desc: "Neighborhood exploration perturbation radius" }
    ],
    gpuKernel: "bee_forage.cl, fitness_kernel.cl",
    csharpSignature: "var abc = new ArtificialBeeColonyOptimizer(foodSources: 64, limit: 100);",
    visualType: "hexgrid"
  },
  {
    id: "ba",
    code: "BA",
    name: "BAT ALGORITHM",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Echolocation & Loudness Tuning",
    description: "Microbat echolocation dynamics with variable pulse emission rates and loudness attenuation. Shifts dynamically from global radar sweeps to tight local sonar exploitation.",
    formula: "f_i = f_{min} + (f_{max} - f_{min})\\beta, \\quad x_i(t) = x_i(t-1) + v_i(t)",
    parameters: [
      { name: "Qmin / Qmax", default: "0.0 / 2.0", desc: "Frequency wave emission bandwidth bounds" },
      { name: "A (Loudness)", default: "0.95", desc: "Loudness attenuation decay multiplier" },
      { name: "r (Pulse Rate)", default: "0.1", desc: "Initial pulse emission rate" }
    ],
    gpuKernel: "bat_echolocation.cl, pso_velocity.cl",
    csharpSignature: "var bat = new BatOptimizer(bats: 128, fMin: 0f, fMax: 2f, loudnessDecay: 0.95f);",
    visualType: "echolocation"
  },
  {
    id: "gwo",
    code: "GWO",
    name: "GREY WOLF OPTIMIZER",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Alpha-Delta Pack Hierarchy",
    description: "Encircling and hunting hierarchy mimicking grey wolf leadership: Alpha (best solution), Beta (second best), and Delta (third best) guide the trajectory of Omega wolves.",
    formula: "\\vec{X}(t+1) = \\frac{\\vec{X}_1 + \\vec{X}_2 + \\vec{X}_3}{3}, \\quad \\vec{X}_1 = \\vec{X}_\\alpha - \\vec{A}_1 \\cdot \\vec{D}_\\alpha",
    parameters: [
      { name: "a (Decay)", default: "2.0 -> 0.0", desc: "Linearly decreased encircling scalar" },
      { name: "A (Vector)", default: "2a * r1 - a", desc: "Encircling coefficient vector" },
      { name: "C (Vector)", default: "2 * r2", desc: "Prey weight coefficient" }
    ],
    gpuKernel: "greywolf_pack.cl, fitness_kernel.cl",
    csharpSignature: "var gwo = new GreyWolfOptimizer(packSize: 64, dimensions: 32);",
    visualType: "pack"
  },
  {
    id: "fss",
    code: "FSS",
    name: "FISH SCHOOL SEARCH",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Coordinated Schooling Search",
    description: "Swimming operators modeling individual feeding, collective instictive feeding, collective volitive contraction/expansion, and school barycenter tracking.",
    formula: "\\vec{x}_i(t+1) = \\vec{x}_i(t) + \\Delta \\vec{x}_{ind,i} + \\Delta \\vec{x}_{inst,i} + \\Delta \\vec{x}_{vol,i}",
    parameters: [
      { name: "StepInd", default: "0.1 * Range", desc: "Individual movement step magnitude" },
      { name: "StepVol", default: "0.01 * Range", desc: "Volitive contraction/dilation step factor" },
      { name: "WeightMax", default: "2.0", desc: "Maximum fish biomass limit" }
    ],
    gpuKernel: "fish_school.cl, nbody_repulsion.cl",
    csharpSignature: "var fss = new FishSchoolOptimizer(schoolSize: 200, stepScale: 0.1f);",
    visualType: "school"
  },
  {
    id: "fa",
    code: "FA",
    name: "FIREFLY ALGORITHM",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Bioluminescent Attraction",
    description: "Light intensity flashing and attractiveness inversely proportional to squared Euclidean distance, driving swarm clustering towards radiant optima.",
    formula: "\\vec{x}_i = \\vec{x}_i + \\beta_0 e^{-\\gamma r_{ij}^2} (\\vec{x}_j - \\vec{x}_i) + \\alpha \\vec{\\epsilon}_i",
    parameters: [
      { name: "beta0 (Base Attract)", default: "1.0", desc: "Attractiveness at zero distance" },
      { name: "gamma (Absorption)", default: "1.0", desc: "Light medium absorption coefficient" },
      { name: "alpha (Randomize)", default: "0.2", desc: "Randomization step parameter" }
    ],
    gpuKernel: "firefly_attraction.cl, pairwise_distance.cl",
    csharpSignature: "var fa = new FireflyOptimizer(swarmSize: 128, beta0: 1.0f, gamma: 1.0f, alpha: 0.2f);",
    visualType: "luminescence"
  },
  {
    id: "gso",
    code: "GSO",
    name: "GLOWWORM SWARM OPTIMIZATION",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Luciferin Neighborhoods",
    description: "Variable local-decision domains and luciferin emission levels enabling simultaneously capturing multiple multimodal peaks without losing diversity.",
    formula: "r_d^i(t+1) = \\min(r_s, \\max(0, r_d^i(t) + \\beta (n_t - |\\mathcal{N}_i(t)|)))",
    parameters: [
      { name: "rho (Luciferin Decay)", default: "0.4", desc: "Luciferin evaporation fraction" },
      { name: "gamma (Luciferin Gain)", default: "0.6", desc: "Fitness conversion factor" },
      { name: "rs (Sensor Range)", default: "3.0", desc: "Radial sensor maximum ceiling" }
    ],
    gpuKernel: "glowworm_luciferin.cl, pairwise_distance.cl",
    csharpSignature: "var gso = new GlowwormSwarmOptimizer(glowworms: 150, sensorRange: 3.0f);",
    visualType: "luciferin"
  },
  {
    id: "cs",
    code: "CS",
    name: "CUCKOO SEARCH",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Lévy Flight Step & Jump",
    description: "Brood parasitism search combined with heavy-tailed Lévy flight jumps for scale-free space exploration and discovering global optima.",
    formula: "\\vec{x}_i^{(t+1)} = \\vec{x}_i^{(t)} + \\alpha \\otimes \\text{Lévy}(\\lambda), \\quad \\text{Lévy} \\sim u = t^{-\\lambda}",
    parameters: [
      { name: "pa (Alien Egg Prob)", default: "0.25", desc: "Fraction of nests replaced per epoch" },
      { name: "lambda (Lévy Index)", default: "1.5", desc: "Heavy-tailed flight jump exponent" },
      { name: "alpha (Step Scale)", default: "0.01", desc: "Lévy step multiplication scalar" }
    ],
    gpuKernel: "levy_flight.cl, rastrigin_fitness.cl",
    csharpSignature: "var cs = new CuckooSearchOptimizer(nests: 64, alienProb: 0.25f, lambda: 1.5f);",
    visualType: "levy"
  },
  {
    id: "kh",
    code: "KH",
    name: "KRILL HERD",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "3D Foraging Dispersion",
    description: "Krill movement induced by individual neighbor interaction, foraging activity based on food location memory, and stochastic directional diffusion.",
    formula: "\\frac{d\\vec{X}_i}{dt} = \\vec{N}_i + \\vec{F}_i + \\vec{D}_i",
    parameters: [
      { name: "Nmax (Induced Speed)", default: "0.01", desc: "Max neighbor attraction magnitude" },
      { name: "Vf (Foraging Speed)", default: "0.02", desc: "Max foraging velocity component" },
      { name: "Dmax (Diffusion)", default: "0.005", desc: "Random diffusion upper bound" }
    ],
    gpuKernel: "krill_herd.cl, nbody_repulsion.cl",
    csharpSignature: "var kh = new KrillHerdOptimizer(krillCount: 128, foragingSpeed: 0.02f);",
    visualType: "vectors3d"
  },
  {
    id: "sync-fa",
    code: "SYNC-FA",
    name: "SYNCHRONIZING FIREFLY",
    category: "CORE SWARM",
    categoryKey: "core",
    color: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.4)",
    subTitle: "Coupled Phase Oscillators",
    description: "Integrates Kuramoto coupled non-linear phase oscillators with spatial coordinates. Swarm members pulse in unison to coordinate global search jumps.",
    formula: "\\frac{d\\theta_i}{dt} = \\omega_i + \\frac{K}{N} \\sum_{j=1}^N \\sin(\\theta_j - \\theta_i)",
    parameters: [
      { name: "K (Coupling)", default: "2.4", desc: "Phase synchronization strength" },
      { name: "Omega (Natural Freq)", default: "1.0", desc: "Baseline oscillator frequency" },
      { name: "PulseThreshold", default: "0.95", desc: "Phase triggering jump threshold" }
    ],
    gpuKernel: "phase_oscillator.cl, firefly_attraction.cl",
    csharpSignature: "var syncFa = new SynchronizingFireflyOptimizer(particles: 100, coupling: 2.4f);",
    visualType: "oscillators"
  },

  // ==========================================
  // --- SECTION 2: HYBRID OPTIMIZERS (14) ---
  // ==========================================
  {
    id: "pso-de",
    code: "PSO-DE",
    name: "PSO + DIFFERENTIAL EVOLUTION",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Velocity Vectors + DE Crossover",
    description: "Blends particle velocity trajectory updates with differential evolution vector mutations and binomial crossover to break out of local stagnation.",
    formula: "\\vec{v}_i = w\\vec{v}_i + c_1 r_1(\\vec{pBest} - \\vec{x}_i) + c_2 r_2(\\vec{gBest} - \\vec{x}_i) \\oplus \\text{DE}(F, CR)",
    parameters: [
      { name: "F (DE Scale)", default: "0.8", desc: "Differential mutation vector scaling" },
      { name: "CR (Crossover)", default: "0.9", desc: "Binomial crossover probability" },
      { name: "HybridRatio", default: "0.5", desc: "Interleaved epoch execution split" }
    ],
    gpuKernel: "de_mutation.cl, pso_velocity.cl",
    csharpSignature: "var hybrid = new PsoDifferentialEvolutionOptimizer(popSize: 200, f: 0.8f, cr: 0.9f);",
    visualType: "hybrid_pso_de"
  },
  {
    id: "pso-gwo",
    code: "PSO-GWO",
    name: "PSO + GREY WOLF",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Pack Hierarchy Guiding Velocity",
    description: "Replaces the single social attractor gBest in PSO with the tripartite hunting vector formed by Alpha, Beta, and Delta wolves.",
    formula: "\\vec{v}_i(t+1) = w\\vec{v}_i(t) + c_1 r_1(\\vec{X}_1 - \\vec{x}_i) + c_2 r_2(\\vec{X}_2 - \\vec{x}_i) + c_3 r_3(\\vec{X}_3 - \\vec{x}_i)",
    parameters: [
      { name: "c1, c2, c3", default: "0.5, 0.3, 0.2", desc: "Weights for Alpha, Beta, Delta guidance" },
      { name: "Inertia", default: "0.7", desc: "Velocity damping factor" }
    ],
    gpuKernel: "greywolf_pack.cl, pso_velocity.cl",
    csharpSignature: "var psoGwo = new PsoGreyWolfOptimizer(popSize: 128);",
    visualType: "hybrid_pso_gwo"
  },
  {
    id: "pso-aco",
    code: "PSO-ACO",
    name: "PSO + ANT COLONY",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Continuous Particle + Discrete Graph",
    description: "Continuous coordinate exploration guided by an underlying discrete pheromone graph matrix, ideal for mixed integer-continuous problems.",
    formula: "\\vec{x}_i(t+1) = \\text{PSO}(\\vec{x}_i) + \\kappa \\cdot \\text{TourSampler}(\\mathbf{T}_{aco})",
    parameters: [
      { name: "PheromoneBoost", default: "1.2", desc: "Attractor multiplier from high pheromone paths" },
      { name: "PsoWeight", default: "0.6", desc: "Continuous space search influence" }
    ],
    gpuKernel: "aco_transition.cl, pso_velocity.cl",
    csharpSignature: "var psoAco = new PsoAntColonyOptimizer(dimensions: 48, graphNodes: 256);",
    visualType: "hybrid_pso_aco"
  },
  {
    id: "pso-fa",
    code: "PSO-FA",
    name: "PSO + FIREFLY",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Luminescence Attraction + Inertia",
    description: "Incorporates firefly luminescence attraction into individual particle personal best updates, avoiding premature convergence at saddle points.",
    formula: "\\vec{x}_i(t+1) = \\vec{x}_i(t) + \\vec{v}_i(t+1) + \\sum_{j \\in \\text{Brighter}} \\beta_0 e^{-\\gamma r_{ij}^2}(\\vec{x}_j - \\vec{x}_i)",
    parameters: [
      { name: "Beta0", default: "0.8", desc: "Inter-particle flash attraction" },
      { name: "Gamma", default: "1.0", desc: "Light absorption scale" }
    ],
    gpuKernel: "firefly_attraction.cl, pso_velocity.cl",
    csharpSignature: "var psoFa = new PsoFireflyOptimizer(popSize: 128, beta0: 0.8f);",
    visualType: "hybrid_pso_fa"
  },
  {
    id: "pso-sa",
    code: "PSO-SA",
    name: "PSO + SIMULATED ANNEALING",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Metropolis Stagnation Prevention",
    description: "Applies the Boltzmann Metropolis probability acceptance criterion to particle pBest updates, accepting worse positions with temperature decay.",
    formula: "P(\\text{accept}) = \\exp(-\\Delta E / T), \\quad T(t+1) = \\alpha T(t)",
    parameters: [
      { name: "InitialTemp", default: "100.0", desc: "Starting annealing temperature" },
      { name: "CoolingRate", default: "0.95", desc: "Geometric temperature reduction scalar" }
    ],
    gpuKernel: "simulated_annealing.cl, pso_velocity.cl",
    csharpSignature: "var psoSa = new PsoSimulatedAnnealingOptimizer(popSize: 100, initTemp: 100f);",
    visualType: "hybrid_pso_sa"
  },
  {
    id: "pso-ts",
    code: "PSO-TS",
    name: "PSO + TABU SEARCH",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Tabu Memory Against Visited Basins",
    description: "Maintains a short-term and long-term tabu tenure memory list. Particles encountering previously explored fitness basins are repelled dynamically.",
    formula: "\\vec{v}_i(t+1) = \\text{PSO}(\\vec{v}_i) + \\sum_{k \\in \\text{Tabu}} \\frac{\\lambda_{tabu}}{\\|\\vec{x}_i - \\vec{x}_k\\|^2} (\\vec{x}_i - \\vec{x}_k)",
    parameters: [
      { name: "TenureLength", default: "25", desc: "Number of steps coordinates remain forbidden" },
      { name: "RepulsionGain", default: "1.5", desc: "Tabu deflection force multiplier" }
    ],
    gpuKernel: "tabu_repulsion.cl, pso_velocity.cl",
    csharpSignature: "var psoTs = new PsoTabuSearchOptimizer(popSize: 64, tabuTenure: 25);",
    visualType: "hybrid_pso_ts"
  },
  {
    id: "pso-cmaes",
    code: "PSO-CMAES",
    name: "PSO + CMA-ES",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Covariance Adaptation on Subclusters",
    description: "Partitions the swarm into subclusters and applies full covariance matrix adaptation (CMA-ES) to rotate coordinate frames along landscape ridges.",
    formula: "\\mathbf{C}^{(g+1)} = (1 - c_1 - c_\\mu)\\mathbf{C}^{(g)} + c_1 \\vec{p}_c \\vec{p}_c^T + c_\\mu \\sum w_i \\vec{y}_i \\vec{y}_i^T",
    parameters: [
      { name: "ClusterCount", default: "4", desc: "Number of parallel CMA-ES covariance islands" },
      { name: "Sigma", default: "0.3", desc: "Initial step-size mutation standard deviation" }
    ],
    gpuKernel: "cma_es_covariance.cl, pso_velocity.cl",
    csharpSignature: "var psoCma = new PsoCmaEsOptimizer(popSize: 128, clusters: 4);",
    visualType: "hybrid_pso_cmaes"
  },
  {
    id: "abc-de",
    code: "ABC-DE",
    name: "ABC + DIFFERENTIAL EVOLUTION",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Differential Vector Mutations in Bee Foraging",
    description: "Replaces standard artificial bee colony scout random restarts with differential evolution vector shifts (DE/rand/1/bin) for faster convergence.",
    formula: "\\vec{v}_{ij} = \\vec{x}_{r1, j} + F \\cdot (\\vec{x}_{r2, j} - \\vec{x}_{r3, j})",
    parameters: [
      { name: "F (Scale)", default: "0.7", desc: "Mutation step scaling factor" },
      { name: "Limit", default: "80", desc: "Abandonment limit before DE mutation injection" }
    ],
    gpuKernel: "de_mutation.cl, bee_forage.cl",
    csharpSignature: "var abcDe = new AbcDifferentialEvolutionOptimizer(foodSources: 64, f: 0.7f);",
    visualType: "hybrid_abc_de"
  },
  {
    id: "aco-ga",
    code: "ACO-GA",
    name: "ACO + GENETIC ALGORITHM",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Chromosome Crossover on High-Pheromone Tours",
    description: "Constructs ant tour solutions via ACO and then applies order crossover (OX) and inversion mutation on elite tours to prevent early stagnation.",
    formula: "\\text{Child} = \\text{OrderCrossover}(\\text{AntTour}_A, \\text{AntTour}_B) \\oplus \\text{PheromoneDeposition}()",
    parameters: [
      { name: "CrossoverRate", default: "0.85", desc: "Probability of chromosome recombination" },
      { name: "MutationRate", default: "0.08", desc: "Tour gene swap mutation probability" }
    ],
    gpuKernel: "aco_transition.cl, fitness_kernel.cl",
    csharpSignature: "var acoGa = new AcoGeneticOptimizer(colonySize: 100, crossoverRate: 0.85f);",
    visualType: "hybrid_aco_ga"
  },
  {
    id: "bco-pso",
    code: "BCO-PSO",
    name: "BCO + PSO",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Bee Foraging Informing Particle Memories",
    description: "Employed and onlooker bees communicate directly with particle personal best memories, coupling food quality signals into social attraction.",
    formula: "\\vec{pBest}_i(t+1) = \\text{argmax}_{f}(\\vec{pBest}_i(t), \\vec{x}_{bee, i}(t+1))",
    parameters: [
      { name: "ColonyRatio", default: "0.5", desc: "Fraction of swarm operating in bee mode" },
      { name: "ExchangeInterval", default: "10", desc: "Epoch interval for cross-model sync" }
    ],
    gpuKernel: "bee_forage.cl, pso_velocity.cl",
    csharpSignature: "var bcoPso = new BcoPsoOptimizer(totalEntities: 128);",
    visualType: "hybrid_bco_pso"
  },
  {
    id: "de-sqp",
    code: "DE-SQP",
    name: "DE + SEQUENTIAL QUADRATIC",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Global DE Exploration + Local SQP Polishing",
    description: "Global differential evolution searches rugged multi-basin landscapes; upon stagnation detection, sequential quadratic programming rapidly polishes the best basin.",
    formula: "\\min_d \\frac{1}{2} d^T \\mathbf{B}_k d + \\nabla f(x_k)^T d \\quad \\text{s.t.} \\quad c(x_k) + \\nabla c(x_k)^T d = 0",
    parameters: [
      { name: "TriggerThreshold", default: "1e-4", desc: "Fitness variance threshold triggering SQP" },
      { name: "MaxSqpIters", default: "50", desc: "Maximum quadratic sub-problem iterations" }
    ],
    gpuKernel: "de_mutation.cl, rastrigin_fitness.cl",
    csharpSignature: "var deSqp = new DeSqpOptimizer(popSize: 64, sqpTolerance: 1e-6f);",
    visualType: "hybrid_de_sqp"
  },
  {
    id: "fa-cs",
    code: "FA-CS",
    name: "FA + CUCKOO SEARCH",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Flashing Attractiveness + Lévy Flight Leaps",
    description: "Combines firefly luminescence clustering with heavy-tailed Lévy flight leaps, preventing fireflies from trapping in sub-optimal local clusters.",
    formula: "\\vec{x}_i(t+1) = \\vec{x}_i(t) + \\beta(r)(\\vec{x}_j - \\vec{x}_i) + \\alpha \\cdot \\text{Lévy}(\\lambda)",
    parameters: [
      { name: "LevyStep", default: "0.05", desc: "Magnitude of long-range Lévy excursions" },
      { name: "Gamma", default: "1.0", desc: "Attractiveness distance attenuation factor" }
    ],
    gpuKernel: "firefly_attraction.cl, levy_flight.cl",
    csharpSignature: "var faCs = new FireflyCuckooOptimizer(popSize: 100, alpha: 0.05f);",
    visualType: "hybrid_fa_cs"
  },
  {
    id: "gwo-woa",
    code: "GWO-WOA",
    name: "GWO + WHALE OPTIMIZER",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Pack Hierarchy + Spiral Bubble-Net Maneuvers",
    description: "Merges grey wolf Alpha/Beta/Delta hunting hierarchy with whale optimization logarithmic spiral bubble-net encircling maneuvers.",
    formula: "\\vec{X}(t+1) = \\vec{D}' \\cdot e^{bl} \\cdot \\cos(2\\pi l) + \\vec{X}^*(t), \\quad \\vec{D}' = |\\vec{X}^*(t) - \\vec{X}(t)|",
    parameters: [
      { name: "b (Spiral Const)", default: "1.0", desc: "Shape constant for logarithmic spiral" },
      { name: "p (Switch Prob)", default: "0.5", desc: "Probability switching between pack hunt and spiral" }
    ],
    gpuKernel: "greywolf_pack.cl, pso_velocity.cl",
    csharpSignature: "var gwoWoa = new GwoWhaleOptimizer(popSize: 80, spiralConstant: 1.0f);",
    visualType: "hybrid_gwo_woa"
  },
  {
    id: "memetic-pso",
    code: "MEMETIC-PSO",
    name: "MEMETIC PSO",
    category: "HYBRID METAHEURISTICS",
    categoryKey: "hybrid",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    subTitle: "Swarm Trajectory + Individual Local Search",
    description: "Every particle performs a short localized line-search polishing routine on its personal best before sharing coordinates with the global swarm.",
    formula: "\\vec{x}_i^* = \\text{LocalSearch}(\\vec{x}_i, \\text{iters}=15), \\quad \\vec{pBest}_i = \\min(f(\\vec{x}_i^*), f(\\vec{pBest}_i))",
    parameters: [
      { name: "LocalIters", default: "15", desc: "Per-particle Nelder-Mead / Hooke-Jeeves steps" },
      { name: "LocalFreq", default: "5", desc: "Epoch interval for launching local polishers" }
    ],
    gpuKernel: "pso_velocity.cl, rastrigin_fitness.cl",
    csharpSignature: "var memetic = new MemeticPsoOptimizer(popSize: 64, localSearchDepth: 15);",
    visualType: "hybrid_memetic"
  },

  // ==========================================
  // --- SECTION 3: ADVANCED METAHEURISTICS (7) ---
  // ==========================================
  {
    id: "bats-beacons",
    code: "BATS & BEACONS",
    name: "OF BATS AND BEACONS SWARM",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "4-Agent Character Trope Architecture",
    description: "Four archetypal character agents collaborate dynamically: Gordon (beacon spotlight guide), Batman (primary vigilante tracker), Robin (supporting wingman), and Joker (chaotic perturbation disrupter).",
    formula: "\\vec{X}_{bat}(t+1) = \\vec{X}_{bat} + \\gamma_{G}(\\vec{X}_{gordon} - \\vec{X}_{bat}) + \\sigma_{R}(\\vec{X}_{robin} - \\vec{X}_{bat}) + \\xi_{J}\\mathcal{C}(0, \\sigma^2)",
    parameters: [
      { name: "GordonRadius", default: "0.15", desc: "Searchlight beacon guidance radius" },
      { name: "RobinCoupling", default: "0.65", desc: "Wingman coordination spring force" },
      { name: "JokerChaosRate", default: "0.08", desc: "Chaotic disruption perturbation probability" }
    ],
    gpuKernel: "nbody_repulsion.cl, pso_velocity.cl",
    csharpSignature: "var batsBeacons = new OfBatsAndBeaconsOptimizer(subswarms: 4, chaosRate: 0.08f);",
    visualType: "bats_beacons"
  },
  {
    id: "ils",
    code: "ILS",
    name: "ITERATED LOCAL SEARCH",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "Perturbation & Local Neighborhood Search",
    description: "Applies systematic perturbation to jump over fitness barriers between basins of attraction, followed by high-speed local neighborhood gradient descent.",
    formula: "s^* = \\text{LocalSearch}(\\text{Perturb}(s, \\text{strength}=p)), \\quad s = \\text{Accept}(s, s^*)",
    parameters: [
      { name: "PerturbStrength", default: "0.2", desc: "Step size of stochastic jump out of basin" },
      { name: "AcceptCriterion", default: "BetterOnly", desc: "Strategy for accepting perturbed state" }
    ],
    gpuKernel: "rastrigin_fitness.cl, fitness_kernel.cl",
    csharpSignature: "var ils = new IteratedLocalSearchOptimizer(perturbation: 0.2f);",
    visualType: "ils"
  },
  {
    id: "map-elites",
    code: "MAP-ELITES",
    name: "MAP-ELITES",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "Multi-dimensional Archive of Phenotypic Elites",
    description: "Quality-diversity algorithm illuminating a high-dimensional feature grid. Retains the highest-performing solution in each behavioral niche cell.",
    formula: "\\text{Cell}(b_1, b_2) = \\text{argmax}_{\\vec{x} \\in \\text{Niche}} f(\\vec{x})",
    parameters: [
      { name: "FeatureGridDim", default: "32 x 32", desc: "Behavioral descriptor discretization resolution" },
      { name: "MutationRadius", default: "0.1", desc: "Offspring mutation variance" }
    ],
    gpuKernel: "tile_placement.cl, fitness_kernel.cl",
    csharpSignature: "var mapElites = new MapElitesOptimizer(gridRes: new[] { 32, 32 });",
    visualType: "map_elites"
  },
  {
    id: "pt",
    code: "PT",
    name: "PARALLEL TEMPERING",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "Replica Exchange Across Heated Tiers",
    description: "Maintains multiple replica Markov chains running at different temperatures. Periodic replica swaps allow exploring rugged energy landscapes without getting trapped.",
    formula: "P(\\text{swap}_{ij}) = \\min\\left(1, \\exp\\left((\\beta_i - \\beta_j)(E_i - E_j)\\right)\\right), \\quad \\beta = \\frac{1}{k_B T}",
    parameters: [
      { name: "Replicas", default: "8", desc: "Number of geometric temperature rungs" },
      { name: "SwapInterval", default: "20", desc: "Iterations between replica swap trials" }
    ],
    gpuKernel: "simulated_annealing.cl, fitness_kernel.cl",
    csharpSignature: "var pt = new ParallelTemperingOptimizer(rungs: 8, tMin: 1f, tMax: 1000f);",
    visualType: "tempering"
  },
  {
    id: "grasp",
    code: "GRASP",
    name: "GREEDY RANDOMIZED ADAPTIVE SEARCH",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "Restricted Candidate List Construction",
    description: "Multi-start metaheuristic combining semi-greedy randomized construction with local improvement for hard routing and combinatorial scheduling.",
    formula: "\\text{RCL} = \\{ e \\in \\text{Candidates} \\mid c(e) \\le c_{min} + \\alpha(c_{max} - c_{min}) \\}",
    parameters: [
      { name: "Alpha (Greediness)", default: "0.3", desc: "Restricted candidate list greediness bound" },
      { name: "MaxRestarts", default: "100", desc: "Number of constructive trials" }
    ],
    gpuKernel: "pairwise_distance.cl, fitness_kernel.cl",
    csharpSignature: "var grasp = new GraspOptimizer(alpha: 0.3f, maxRestarts: 100);",
    visualType: "grasp"
  },
  {
    id: "lagrangian",
    code: "LR",
    name: "LAGRANGIAN RELAXATION",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "Dual Constraint Relaxation",
    description: "Relaxes hard linear and non-linear constraints into the objective function with Lagrange multipliers, iteratively adjusting multipliers via subgradient methods.",
    formula: "\\mathcal{L}(\\vec{x}, \\vec{\\lambda}) = f(\\vec{x}) + \\sum_j \\lambda_j g_j(\\vec{x}), \\quad \\lambda_j^{(k+1)} = \\max(0, \\lambda_j^{(k)} + \\theta_k g_j(\\vec{x}^{(k)}))",
    parameters: [
      { name: "StepSize (Theta)", default: "0.05", desc: "Subgradient step size parameter" },
      { name: "DecayFactor", default: "0.98", desc: "Step size geometric cooling decay" }
    ],
    gpuKernel: "fitness_kernel.cl, pso_velocity.cl",
    csharpSignature: "var lr = new LagrangianRelaxationOptimizer(constraints: 12);",
    visualType: "lagrangian"
  },
  {
    id: "aug-lagrangian",
    code: "AL",
    name: "AUGMENTED LAGRANGIAN SWARM",
    category: "ADVANCED METAHEURISTICS",
    categoryKey: "advanced",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    subTitle: "Constrained Penalty Convergence",
    description: "Augments the Lagrangian with quadratic penalty terms to guarantee strict feasibility in highly constrained non-convex optimization manifolds.",
    formula: "\\mathcal{L}_A(\\vec{x}, \\vec{\\lambda}, \\mu) = f(\\vec{x}) + \\sum_i \\lambda_i c_i(\\vec{x}) + \\frac{\\mu}{2} \\sum_i \\|c_i(\\vec{x})\\|^2",
    parameters: [
      { name: "InitialPenalty (Mu)", default: "10.0", desc: "Starting quadratic penalty scalar" },
      { name: "PenaltyGrowth", default: "2.0", desc: "Multiplier applied on constraint violation" }
    ],
    gpuKernel: "fitness_kernel.cl, pso_velocity.cl",
    csharpSignature: "var al = new AugmentedLagrangianSwarmOptimizer(mu: 10f);",
    visualType: "aug_lagrangian"
  },

  // ==========================================
  // --- SECTION 4: MULTI-OBJECTIVE (3) ---
  // ==========================================
  {
    id: "mopso",
    code: "MOPSO",
    name: "MULTI-OBJECTIVE PSO",
    category: "MULTI-OBJECTIVE",
    categoryKey: "mo",
    color: "#84cc16",
    glowColor: "rgba(132, 204, 22, 0.4)",
    subTitle: "Pareto Frontier External Archive",
    description: "Maintains an external non-dominated archive of Pareto-optimal trade-off leaders. Particles select global leaders via grid-density roulette.",
    formula: "\\vec{x} \\prec \\vec{y} \\iff \\forall i \\, f_i(\\vec{x}) \\le f_i(\\vec{y}) \\land \\exists j \\, f_j(\\vec{x}) < f_j(\\vec{y})",
    parameters: [
      { name: "ArchiveSize", default: "200", desc: "Max non-dominated solutions preserved" },
      { name: "GridDivisions", default: "30", desc: "Objective space adaptive grid resolution" }
    ],
    gpuKernel: "dominance_matrix.cl, monte_carlo_hypervolume.cl",
    csharpSignature: "var mopso = new MultiObjectivePsoOptimizer(archiveCapacity: 200, objectives: 2);",
    visualType: "mopso"
  },
  {
    id: "nsga3",
    code: "NSGA-III",
    name: "NSGA-III-STYLE PSO",
    category: "MULTI-OBJECTIVE",
    categoryKey: "mo",
    color: "#84cc16",
    glowColor: "rgba(132, 204, 22, 0.4)",
    subTitle: "Reference Point Simplex Selection",
    description: "Uses structured reference points on a normalized hyperplane to preserve uniform Pareto distribution across many-objective (3 to 10+ objectives) spaces.",
    formula: "d(s, \\vec{w}) = \\left\\| \\left(\\vec{f}'(s) - \\frac{\\vec{f}'(s)^T \\vec{w}}{\\|\\vec{w}\\|^2} \\vec{w}\\right) \\right\\|",
    parameters: [
      { name: "ReferencePoints", default: "91 (for 3D)", desc: "Das-Dennis simplex reference grid size" },
      { name: "Objectives", default: "3", desc: "Dimensionality of objective space" }
    ],
    gpuKernel: "dominance_matrix.cl, monte_carlo_hypervolume.cl",
    csharpSignature: "var nsga3 = new Nsga3PsoOptimizer(objectives: 3, referenceDivisions: 12);",
    visualType: "nsga3"
  },
  {
    id: "moswarm",
    code: "MO-SWARM",
    name: "GENERAL MULTI-OBJECTIVE SWARM",
    category: "MULTI-OBJECTIVE",
    categoryKey: "mo",
    color: "#84cc16",
    glowColor: "rgba(132, 204, 22, 0.4)",
    subTitle: "Multi-Tier Pareto Ranking & Hypervolume",
    description: "Pluggable dominance comparator with GPU-accelerated Monte Carlo hypervolume estimation, crowding distance niching, and dynamic frontier filtering.",
    formula: "\\text{HV}(S, \\vec{r}) = \\text{Volume}\\left(\\bigcup_{\\vec{x} \\in S} [\\vec{f}(\\vec{x}), \\vec{r}]\\right)",
    parameters: [
      { name: "McSamples", default: "100,000", desc: "GPU Monte Carlo hypervolume sample points" },
      { name: "ReferencePoint", default: "(1.1, 1.1, ...)", desc: "Anti-ideal worst-case bounding corner" }
    ],
    gpuKernel: "monte_carlo_hypervolume.cl, dominance_matrix.cl",
    csharpSignature: "var moSwarm = new GeneralMultiObjectiveSwarm(objectives: 4);",
    visualType: "moswarm"
  }
];
