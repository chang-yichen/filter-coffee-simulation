export interface PourEntry {
  startTime: number;  // seconds from brew start
  amount: number;     // grams (≈ ml) for this pour
}

export interface BrewParams {
  dose: number;          // grams of coffee
  grind: number;         // microns (particle diameter)
  waterTotal: number;    // grams of water
  temp: number;          // Celsius
  pourRate: number;      // ml/s (applies to every pour)
  numPours: number;      // used only when pourSchedule is absent
  dripperType: 'cone' | 'cylinder';
  diameter: number;      // mm
  pourSchedule?: PourEntry[];  // fixed schedule; overrides numPours auto-spacing
  // Pouring technique (all default to best-practice = true/circular/even)
  pourPattern: 'center' | 'circular';
  avoidPaper: boolean;
  bloomWetting: 'even' | 'center';
  swirl: boolean;
  // Bean characteristics
  roastLevel: 'light' | 'medium' | 'dark';
  beanFreshness: 'fresh' | 'rested' | 'stale';
}

export interface BrewConstants {
  k_SI: number;          // permeability (m²)
  L_SI: number;          // bed depth (m)
  A_SI: number;          // cross-section area (m²)
  nu_SI: number;         // kinematic viscosity (m²/s)
  geoFactor: number;     // dripper geometry correction
  bedDepth: number;      // mm (Darcy-model simplified bed depth)
  pourStarts: number[];  // pour start times (s)
  pourDurs: number[];    // duration of each pour (s) = amount / pourRate
  waterPerPours: number[]; // grams for each individual pour
  maxSoluble: number;    // max extractable mass (g)
  bedCapacity: number;   // water retained in bed = LRR × dose (g)
  channelingFrac: number; // fraction of flow that bypasses the bed (0..0.21)
  // Cone geometry (only meaningful when dripperType === 'cone')
  bedTopDiamMM: number;  // actual physical bed top diameter (mm) from cone geometry
  coneHBedMM: number;    // actual bed height from cone tip (mm)
  coneHBedM: number;     // same in metres (for water-column update)
  maxWaterColMM: number; // max physical water column above bed before reaching rim (mm)
}

export interface GrindParticle {
  x: number;    // -0.5..0.5, fraction of local bed width
  y: number;    // 0..1, normalized bed depth (0=top, 1=bottom)
  size: number; // radius multiplier 0.6..1.4 for particle size variation
}

export interface BloomBubble {
  x: number;       // -0.5..0.5 relative to bed width
  yOffset: number; // canvas-px above bed surface (increases as bubble rises)
  r: number;       // radius in canvas pixels
  vy: number;      // rise speed (canvas-px / simulation-s)
  life: number;    // opacity, 0..1
}

export interface Drop {
  y: number;
  vy: number;  // velocity (canvas-px / simulation-s)
  x: number;
}

export interface SteamParticle {
  x: number;
  y: number;
  life: number;
  speed: number;
}

export interface FlowParticle {
  x: number;
  y: number;        // 0 = bed top, 1 = bed bottom
  speed: number;
}

export interface TurbulenceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface AnimState {
  t: number;
  wCol: number;         // water column height (m)
  poured: number;       // total water poured (g)
  dripped: number;      // water delivered to cup (g) — excludes bed retention
  absorbed: number;     // water retained by coffee bed (g), max = bedCapacity
  extracted: number;    // total extracted mass (g)
  curPour: number;
  pouring: boolean;
  pourEnd: number;
  Q: number;            // current drip rate (m³/s)
  done: boolean;
  agitationEnergy: number;  // 0..1 turbulence
  grindParticles: GrindParticle[];
  bloomBubbles: BloomBubble[];
  drops: Drop[];
  steamParticles: SteamParticle[];
  flowParticles: FlowParticle[];
  turbulenceParticles: TurbulenceParticle[];
}

export interface SimResult {
  timeData: number[];
  dripRateData: number[];
  waterHeightData: number[];
  eyData: number[];
  agitationData: number[];
  brewTime: number;
  EY: number;
  TDS: number;
  beverageWeight: number;
  bedDepth: number;
}
