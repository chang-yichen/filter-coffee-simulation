import type { BrewParams, BrewConstants, AnimState, SimResult } from './types';
import {
  kinematicViscosity, permeability, diffusionFactor, surfaceAreaFactor,
  agitationFromPour, decayAgitation, agitationPermeabilityMultiplier,
  darcyFlowRate, bedDepthMM, coneBedTopDiameterMM, V60_HALF_ANGLE, LRR, G,
} from './physics';

// ---- Cone water geometry helpers ----

/**
 * Cross-sectional area of the cone at the current water surface (m²).
 * hFromTip = coneHBedM + wCol  (metres from the cone tip).
 */
function coneWaterSurfaceAreaM2(coneHBedM: number, wCol: number): number {
  const hFromTip = coneHBedM + wCol;
  const t = Math.tan(V60_HALF_ANGLE);
  return Math.PI * hFromTip * hFromTip * t * t;
}

/**
 * Volume of water sitting above the bed in the cone (m³).
 * = difference in cone volumes between top-of-water and top-of-bed.
 */
function coneWaterVolumeM3(coneHBedM: number, wCol: number): number {
  const t = Math.tan(V60_HALF_ANGLE);
  const hTop = coneHBedM + wCol;
  return (Math.PI * t * t / 3) * (hTop * hTop * hTop - coneHBedM * coneHBedM * coneHBedM);
}

// ---- Build derived constants from user params ----

export function buildBrewConstants(p: BrewParams): BrewConstants {
  const radiusMM = p.diameter / 2;
  const areaTopMM2 = Math.PI * radiusMM * radiusMM;
  const bed = bedDepthMM(p.dose, areaTopMM2, p.dripperType);

  const k_SI = permeability(p.grind);
  const L_SI = bed / 1000;
  const A_SI = areaTopMM2 * 1e-6;
  const nu_SI = kinematicViscosity(p.temp);
  // geoFactor recalibrated (0.85 → 0.46) after switching from cylindrical to true
  // conical water-column update: same 167g pour now gives ~29mm head vs ~16mm before
  // (1.86× higher), so geoFactor = 0.85/1.86 ≈ 0.46 keeps ~3 min brew time.
  const geoFactor = p.dripperType === 'cone' ? 0.46 : 1.0;

  // Pour schedule: use fixed schedule if provided, otherwise auto-space equal pours.
  let pourStarts: number[];
  let pourDurs: number[];
  let waterPerPours: number[];
  if (p.pourSchedule && p.pourSchedule.length > 0) {
    pourStarts    = p.pourSchedule.map(e => e.startTime);
    pourDurs      = p.pourSchedule.map(e => e.amount / p.pourRate);
    waterPerPours = p.pourSchedule.map(e => e.amount);
  } else {
    const wpp = p.waterTotal / p.numPours;
    const dur = wpp / p.pourRate;
    pourStarts    = Array.from({ length: p.numPours }, (_, i) => i * dur * 2.0);
    pourDurs      = Array.from({ length: p.numPours }, () => dur);
    waterPerPours = Array.from({ length: p.numPours }, () => wpp);
  }

  // True conical geometry (V60 half-angle 30°)
  const tanTheta = Math.tan(V60_HALF_ANGLE); // tan(30°) ≈ 0.577
  const bedTopDiamMM = p.dripperType === 'cone'
    ? coneBedTopDiameterMM(p.dose, p.diameter)
    : p.diameter;
  const coneHBedMM = p.dripperType === 'cone'
    ? bedTopDiamMM / (2 * tanTheta)
    : 0;
  const coneHBedM = coneHBedMM / 1000;
  // Space above the coffee bed up to the top rim (= max physical water column)
  const coneHTotalMM = p.dripperType === 'cone' ? (p.diameter / 2) / tanTheta : 0;
  const maxWaterColMM = p.dripperType === 'cone'
    ? Math.max(1, coneHTotalMM - coneHBedMM)
    : 65;

  return {
    k_SI, L_SI, A_SI, nu_SI, geoFactor, bedDepth: bed,
    pourStarts, pourDurs, waterPerPours,
    maxSoluble: p.dose * 0.30,
    bedCapacity: LRR * p.dose,
    bedTopDiamMM, coneHBedMM, coneHBedM, maxWaterColMM,
  };
}

// ---- Extraction rate calculation ----

function extractionIncrement(
  p: BrewParams, s: BrewConstants,
  extracted: number, wCol: number, agitation: number, dt: number
): number {
  const sa = surfaceAreaFactor(p.grind);
  const df = diffusionFactor(p.temp);
  const frac = extracted / s.maxSoluble;
  // drive = 1 at start, 0 at maxSoluble (30% EY). The old 1.5× multiplier
  // hard-capped extraction at 20% EY regardless of grind — removing it allows
  // fine grind to over-extract and coarse grind to under-extract naturally.
  const drive = Math.max(0, 1 - frac);
  const contact = Math.min(1, (wCol * 1000 + s.bedDepth * 0.5) / s.bedDepth);
  // Agitation slightly boosts extraction (better mixing at surface)
  const agitBoost = 1.0 + 0.3 * agitation;
  // Rate constant lowered (0.003→0.0022) to keep medium grind in 18-22% EY
  // after removing the artificial drive cap.
  const rate = 0.0026 * p.dose * sa * df * drive * contact * agitBoost;
  return Math.min(s.maxSoluble - extracted, rate * dt);
}

// ---- Full simulation (for charts + metrics) ----

export function simulateFull(p: BrewParams): SimResult {
  const s = buildBrewConstants(p);
  const dt = 0.25;
  const maxT = 600;

  let wCol = 0, poured = 0, extracted = 0, agitation = 0, absorbed = 0;
  let curPour = 0, pouring = false, pourEnd = 0;

  const timeData: number[] = [];
  const dripRateData: number[] = [];
  const waterHeightData: number[] = [];
  const eyData: number[] = [];
  const agitationData: number[] = [];

  for (let t = 0; t < maxT; t += dt) {
    // Pour logic
    if (curPour < s.pourStarts.length && t >= s.pourStarts[curPour]) {
      pouring = true;
      pourEnd = s.pourStarts[curPour] + s.pourDurs[curPour];
      curPour++;
    }
    if (pouring && t < pourEnd && poured < p.waterTotal) {
      const add = Math.min(p.pourRate * dt, p.waterTotal - poured);
      poured += add;
      // Cone: water height rises faster near the narrow bed, slower near the wide rim
      if (p.dripperType === 'cone' && s.coneHBedM > 0) {
        const A_surf = coneWaterSurfaceAreaM2(s.coneHBedM, wCol);
        wCol += (add * 1e-6) / A_surf;
      } else {
        wCol += (add * 1e-6) / s.A_SI;
      }
      agitation = Math.min(1.0, agitation + agitationFromPour(p.pourRate) * dt);
    }
    if (t >= pourEnd) pouring = false;

    // Agitation decay
    agitation = decayAgitation(agitation, dt);

    // Darcy's Law with agitation-modified permeability
    const kEff = s.k_SI * agitationPermeabilityMultiplier(agitation);
    const Q = darcyFlowRate(kEff, s.A_SI, G, wCol, s.nu_SI, s.L_SI, s.geoFactor);
    // Max drain = actual water volume above bed (cone-aware)
    const maxDrainG = p.dripperType === 'cone' && s.coneHBedM > 0
      ? coneWaterVolumeM3(s.coneHBedM, wCol) * 1e6
      : wCol * s.A_SI * 1e6;
    const dripG = Math.min(Q * 1e6 * dt, maxDrainG);

    // Water absorption: the bed retains LRR×dose grams total (never reaches cup)
    const absorb = Math.min(s.bedCapacity - absorbed, dripG);
    absorbed += absorb;
    if (p.dripperType === 'cone' && s.coneHBedM > 0) {
      const A_surf = coneWaterSurfaceAreaM2(s.coneHBedM, wCol);
      wCol = Math.max(0, wCol - (dripG * 1e-6) / A_surf);
    } else {
      wCol = Math.max(0, wCol - (dripG * 1e-6) / s.A_SI);
    }

    // Extraction
    extracted += extractionIncrement(p, s, extracted, wCol, agitation, dt);

    // Sample every second
    // Water height = free water above bed + bed depth = total visible level in dripper
    if (Math.abs(t % 1) < dt / 2) {
      timeData.push(t);
      dripRateData.push(Q * 1e6);
      waterHeightData.push((wCol + s.L_SI) * 1000);
      eyData.push((extracted / p.dose) * 100);
      agitationData.push(agitation);
    }

    // Check done
    if (poured >= p.waterTotal * 0.99 && wCol < 0.0003) {
      timeData.push(t);
      dripRateData.push(0);
      waterHeightData.push(s.bedDepth);  // bed depth remains after draining
      eyData.push((extracted / p.dose) * 100);
      agitationData.push(agitation);

      const bev = p.waterTotal - LRR * p.dose;
      return {
        timeData, dripRateData, waterHeightData, eyData, agitationData,
        brewTime: t,
        EY: (extracted / p.dose) * 100,
        TDS: (extracted / bev) * 100,
        beverageWeight: bev,
        bedDepth: s.bedDepth,
      };
    }
  }

  const bev = p.waterTotal - LRR * p.dose;
  return {
    timeData, dripRateData, waterHeightData, eyData, agitationData,
    brewTime: maxT,
    EY: (extracted / p.dose) * 100,
    TDS: (extracted / bev) * 100,
    beverageWeight: bev,
    bedDepth: s.bedDepth,
  };
}

// ---- Step-by-step animation state ----

export function createAnimState(): AnimState {
  // Seed stable grind particle positions — x is fraction of local bed width, y is 0..1 depth
  const grindParticles = Array.from({ length: 100 }, () => ({
    x: (Math.random() - 0.5) * 0.88,
    y: Math.random(),
    size: 0.6 + Math.random() * 0.8,
  }));
  return {
    t: 0, wCol: 0, poured: 0, dripped: 0, absorbed: 0, extracted: 0,
    curPour: 0, pouring: false, pourEnd: 0, Q: 0, done: false,
    agitationEnergy: 0,
    grindParticles,
    bloomBubbles: [],
    drops: [], steamParticles: [], flowParticles: [], turbulenceParticles: [],
  };
}

export function animStep(
  a: AnimState, s: BrewConstants, p: BrewParams, dt: number
): void {
  if (a.done) return;
  a.t += dt;

  // Pour logic
  if (a.curPour < s.pourStarts.length && a.t >= s.pourStarts[a.curPour]) {
    a.pouring = true;
    a.pourEnd = s.pourStarts[a.curPour] + s.pourDurs[a.curPour];
    a.curPour++;
  }
  if (a.pouring && a.t < a.pourEnd && a.poured < p.waterTotal) {
    const add = Math.min(p.pourRate * dt, p.waterTotal - a.poured);
    a.poured += add;
    // Cone: use actual cross-section at the current water surface
    if (p.dripperType === 'cone' && s.coneHBedM > 0) {
      const A_surf = coneWaterSurfaceAreaM2(s.coneHBedM, a.wCol);
      a.wCol += (add * 1e-6) / A_surf;
    } else {
      a.wCol += (add * 1e-6) / s.A_SI;
    }
    // Agitation from pour impact
    a.agitationEnergy = Math.min(1.0, a.agitationEnergy + agitationFromPour(p.pourRate) * dt);
  }
  if (a.t >= a.pourEnd) a.pouring = false;

  // Agitation decay
  a.agitationEnergy = decayAgitation(a.agitationEnergy, dt);

  // Darcy's Law with agitation
  const kEff = s.k_SI * agitationPermeabilityMultiplier(a.agitationEnergy);
  a.Q = darcyFlowRate(kEff, s.A_SI, G, a.wCol, s.nu_SI, s.L_SI, s.geoFactor);

  const maxDrainG = p.dripperType === 'cone' && s.coneHBedM > 0
    ? coneWaterVolumeM3(s.coneHBedM, a.wCol) * 1e6
    : a.wCol * s.A_SI * 1e6;
  const dripG = Math.min(a.Q * 1e6 * dt, maxDrainG);
  // Water absorbed by coffee bed — retained in grounds, never reaches cup
  const absorb = Math.min(s.bedCapacity - a.absorbed, dripG);
  a.absorbed += absorb;
  a.dripped += dripG - absorb;  // only cup-bound water
  if (p.dripperType === 'cone' && s.coneHBedM > 0) {
    const A_surf = coneWaterSurfaceAreaM2(s.coneHBedM, a.wCol);
    a.wCol = Math.max(0, a.wCol - (dripG * 1e-6) / A_surf);
  } else {
    a.wCol = Math.max(0, a.wCol - (dripG * 1e-6) / s.A_SI);
  }

  // Extraction
  a.extracted += extractionIncrement(p, s, a.extracted, a.wCol, a.agitationEnergy, dt);

  // Spawn drip drops — initial velocity proportional to drip rate
  const dripRate = a.Q * 1e6; // g/s
  if (dripRate > 0.1 && Math.random() < Math.min(0.8, dripRate * 0.12)) {
    a.drops.push({ y: 0, vy: 30 + dripRate * 4 + Math.random() * 15, x: (Math.random() - 0.5) * 8 });
  }

  // Spawn flow particles inside bed (Darcy velocity visualization)
  const darcyV = a.wCol > 0
    ? (kEff * G * a.wCol) / (s.nu_SI * s.L_SI) * 1000  // mm/s through bed
    : 0;
  if (darcyV > 0.5 && Math.random() < Math.min(0.5, darcyV * 0.05)) {
    a.flowParticles.push({
      x: (Math.random() - 0.5) * 0.8,  // normalized -0.4..0.4
      y: 0,
      speed: darcyV,
    });
  }

  // Update flow particles
  for (let i = a.flowParticles.length - 1; i >= 0; i--) {
    const fp = a.flowParticles[i];
    fp.y += (fp.speed / (s.bedDepth)) * dt;  // normalize to bed depth
    if (fp.y > 1) a.flowParticles.splice(i, 1);
  }

  // Spawn turbulence particles when agitated — bigger burst during pour impact
  if (a.agitationEnergy > 0.04 && Math.random() < a.agitationEnergy * 1.6) {
    a.turbulenceParticles.push({
      x: (Math.random() - 0.5) * 0.8,
      y: Math.random() * 0.4,  // near water/bed interface
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 35,
      life: 1.0,
    });
  }

  // Spawn CO2 bloom bubbles — rise through water column during agitation
  if (a.agitationEnergy > 0.06 && a.wCol > 0.0008 && Math.random() < a.agitationEnergy * 1.0) {
    a.bloomBubbles.push({
      x: (Math.random() - 0.5) * 0.82,
      yOffset: 0,
      r: 1.2 + Math.random() * 3.5,
      vy: 18 + Math.random() * 50,
      life: 1.0,
    });
  }

  // Update bloom bubbles
  for (let i = a.bloomBubbles.length - 1; i >= 0; i--) {
    const bb = a.bloomBubbles[i];
    bb.yOffset += bb.vy * dt;
    bb.life -= dt * 1.6;
    if (bb.life <= 0) a.bloomBubbles.splice(i, 1);
  }

  // Update turbulence particles
  for (let i = a.turbulenceParticles.length - 1; i >= 0; i--) {
    const tp = a.turbulenceParticles[i];
    tp.x += tp.vx * dt * 0.001;
    tp.y += tp.vy * dt * 0.001;
    tp.life -= dt * 2.5;
    if (tp.life <= 0) a.turbulenceParticles.splice(i, 1);
  }

  // Spawn steam
  if (p.temp > 80 && a.dripped > 10 && Math.random() < 0.15) {
    a.steamParticles.push({
      x: (Math.random() - 0.5) * 40,
      y: 0,
      life: 1,
      speed: 0.3 + Math.random() * 0.4,
    });
  }

  // Update steam
  for (let i = a.steamParticles.length - 1; i >= 0; i--) {
    const sp = a.steamParticles[i];
    sp.y -= sp.speed;
    sp.x += Math.sin(sp.y * 0.2) * 0.3;
    sp.life -= 0.008;
    if (sp.life <= 0) a.steamParticles.splice(i, 1);
  }

  // Update drops — gravity acceleration: v += g·dt, y += v·dt
  for (let i = a.drops.length - 1; i >= 0; i--) {
    const dr = a.drops[i];
    dr.vy += 280 * dt;  // gravity (canvas-px / sim-s²)
    dr.y += dr.vy * dt;
    if (dr.y > 240) a.drops.splice(i, 1);
  }

  // Check done
  if (a.poured >= p.waterTotal * 0.99 && a.wCol < 0.0003) {
    a.done = true;
  }
}
