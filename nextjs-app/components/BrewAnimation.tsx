'use client';

import { useRef, useEffect } from 'react';
import { useBrew } from './BrewContext';
import type { AnimState, BrewParams, BrewConstants } from '@/lib/types';
import { V60_HALF_ANGLE } from '@/lib/physics';

function brewColor(extracted: number, dripped: number): string {
  const tds = extracted > 0 && dripped > 0 ? extracted / Math.max(1, dripped) : 0;
  const d = Math.min(1, tds * 70);
  return `rgb(${Math.round(210 - 120 * d)},${Math.round(190 - 130 * d)},${Math.round(140 - 100 * d)})`;
}

function drawFrame(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  a: AnimState, p: BrewParams, s: BrewConstants
) {
  ctx.clearRect(0, 0, W, H);

  // ── Geometry ──────────────────────────────────────────────────────────────
  const cx = W / 2;
  const dTop = 58, dH = 235;
  const topW = 185, botW = 30;
  const dropStartY = dTop + dH + 5;
  const cupTop = dropStartY + 85;
  const cupH = 175, cupW = 170;
  const isCone = p.dripperType === 'cone';

  // Coffee bed
  const bedFrac = isCone ? Math.min(0.65, s.bedDepth / 55) : Math.min(0.55, s.bedDepth / 45);
  const bedTopY = dTop + dH * (1 - bedFrac);
  // Width of the cone at bedTopY: interpolate from botW (tip) to topW (rim) by bedFrac
  const bedTopW = isCone ? botW + (topW - botW) * bedFrac : topW;

  // Cup fill — based on actual beverage weight (water not retained by grounds)
  const color = brewColor(a.extracted, a.dripped);
  const maxCupG = (p.waterTotal - s.bedCapacity) * 0.97;  // LRR×dose retained in bed
  const fillFrac = Math.min(0.88, (a.dripped / maxCupG) * 0.88);
  const fillH = fillFrac * cupH;
  const fillTop = fillFrac > 0.005 ? cupTop + cupH - fillH : cupTop + cupH;
  const shr = fillFrac > 0.005 ? 12 * (1 - fillFrac / 0.88) : 12;

  // ── DRAW ORDER ────────────────────────────────────────────────────────────
  // 1. Kettle + pour stream
  // 2. Dripper shell + filter paper
  // 3. Coffee bed + grind particles
  // 4. Flow particles
  // 5. Water column + turbulence + bloom bubbles
  // 6. Cup fill        ← before drops
  // 7. Drops + stream  ← on top of fill, visible inside cup
  // 8. Cup walls       ← last, acts as mask for anything outside
  // 9. Cup surface shimmer + ripple
  // 10. Steam
  // 11. Labels

  // ── 1. KETTLE & POUR STREAM ───────────────────────────────────────────────
  if (a.pouring) {
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.moveTo(cx + 52, 10); ctx.lineTo(cx + 72, 10);
    ctx.lineTo(cx + 50, 38); ctx.lineTo(cx + 36, 38);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = '#888'; ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx + 72, 10);
    ctx.quadraticCurveTo(cx + 88, 10, cx + 88, 24);
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.ellipse(cx + 114, 22, 30, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pour stream — spiraling arc
    const streamW = 2.5 + p.pourRate * 0.38;
    ctx.strokeStyle = `rgba(74,144,217,${0.55 + Math.min(0.35, p.pourRate * 0.025)})`;
    ctx.lineWidth = streamW;
    ctx.beginPath();
    const spiral = Math.sin(a.t * 8) * (3.5 + p.pourRate * 0.5);
    ctx.moveTo(cx + 42, 36);
    ctx.bezierCurveTo(cx + 18, dTop - 16, cx + spiral * 0.9, dTop - 4, cx + spiral * 0.25, dTop + 14);
    ctx.stroke();

    // Impact splash
    const splashCount = Math.round(3 + p.pourRate * 1.8);
    for (let i = 0; i < splashCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = (4 + p.pourRate * 2.5) * Math.random();
      ctx.fillStyle = `rgba(74,144,217,${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(
        cx + spiral * 0.25 + Math.cos(angle) * dist,
        dTop + 14 + Math.sin(angle) * dist * 0.4,
        1.5 + Math.random() * 2, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  // ── 2–5. DRIPPER INTERIOR (clipped so nothing escapes the cone) ───────────
  // Clip path = dripper shape. Everything inside is painted here;
  // the outline is drawn AFTER restore so it sits on top cleanly.
  ctx.save();
  ctx.beginPath();
  if (isCone) {
    ctx.moveTo(cx - topW / 2, dTop);
    ctx.lineTo(cx - botW / 2, dTop + dH);
    ctx.lineTo(cx + botW / 2, dTop + dH);
    ctx.lineTo(cx + topW / 2, dTop);
  } else {
    ctx.rect(cx - topW / 2, dTop, topW, dH);
  }
  ctx.closePath();
  ctx.clip();

  // 2a. Filter paper — flood-fill the clipped region
  ctx.fillStyle = '#F2EDE5';
  ctx.fillRect(0, 0, W, H);

  // 2b. Coffee bed
  if (isCone) {
    ctx.beginPath();
    ctx.moveTo(cx - bedTopW / 2, bedTopY);
    ctx.lineTo(cx - botW / 2, dTop + dH);
    ctx.lineTo(cx + botW / 2, dTop + dH);
    ctx.lineTo(cx + bedTopW / 2, bedTopY);
    ctx.closePath();
    ctx.fillStyle = '#8B6F4E'; ctx.fill();
  } else {
    ctx.fillStyle = '#8B6F4E';
    ctx.fillRect(cx - topW / 2, bedTopY, topW, dTop + dH - bedTopY);
  }

  // 3. Grind particles — stable positions, agitation-driven displacement
  const baseSize = Math.max(1.8, Math.min(5.5, p.grind / 180));
  for (const gp of a.grindParticles) {
    const layerFactor = 1 - gp.y * 0.5;
    const ag = a.agitationEnergy * layerFactor;
    const jx = ag > 0.02 ? Math.sin(a.t * 22 + gp.x * 40) * ag * 9 : 0;
    const jy = ag > 0.02 ? Math.cos(a.t * 17 + gp.y * 35) * ag * 6 : 0;

    let px: number, py: number;
    if (isCone) {
      py = bedTopY + gp.y * (dTop + dH - bedTopY) + jy;
      const wAt = botW + (bedTopW - botW) * (1 - gp.y);
      px = cx + gp.x * wAt + jx;
    } else {
      px = cx + gp.x * (topW - 10) + jx;
      py = bedTopY + 3 + gp.y * (dTop + dH - bedTopY - 6) + jy;
    }

    const agBright = ag > 0.1 ? Math.floor(ag * 15) : 0;
    ctx.fillStyle = `rgb(${92 + agBright},${61 + agBright},${30 + agBright})`;
    ctx.beginPath();
    ctx.arc(px, py, baseSize * gp.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Flow particles (Darcy velocity)
  ctx.fillStyle = 'rgba(74,144,217,0.6)';
  for (const fp of a.flowParticles) {
    const py = bedTopY + fp.y * (dTop + dH - bedTopY);
    const wAtY = isCone ? botW + (bedTopW - botW) * (1 - fp.y) : topW;
    const px = cx + fp.x * wAtY;
    ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2); ctx.fill();
  }

  // 5. Water column
  const wColMM = a.wCol * 1000;
  // Normalize water column against the actual remaining cone height above the bed
  const wFrac = Math.min(1 - bedFrac - 0.03, (wColMM / s.maxWaterColMM) * (1 - bedFrac));

  if (wFrac > 0.003) {
    const tempAlpha = 0.22 + (p.temp - 70) / 100 * 0.22;
    const waveAmp = 1.8 + a.agitationEnergy * 8;
    const waveSpeed = 18 * (1 + a.agitationEnergy * 3);
    // Correct wTopW: width at the water surface = botW + (topW-botW) * (bedFrac + wFrac)
    const wTopW = isCone ? botW + (topW - botW) * (bedFrac + wFrac) : topW;
    const wTopY = Math.max(dTop + 2, bedTopY - wFrac * dH);

    if (isCone) {
      ctx.beginPath();
      ctx.moveTo(cx - wTopW / 2, wTopY); ctx.lineTo(cx - bedTopW / 2, bedTopY);
      ctx.lineTo(cx + bedTopW / 2, bedTopY); ctx.lineTo(cx + wTopW / 2, wTopY);
      ctx.closePath();
      ctx.fillStyle = `rgba(74,144,217,${tempAlpha})`; ctx.fill();
    } else {
      ctx.fillStyle = `rgba(74,144,217,${tempAlpha})`;
      ctx.fillRect(cx - topW / 2, wTopY, topW, bedTopY - wTopY);
    }

    ctx.strokeStyle = `rgba(74,144,217,${0.45 + a.agitationEnergy * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const waveLeft = isCone ? -wTopW / 2 : -topW / 2 + 2;
    const waveRight = isCone ? wTopW / 2 : topW / 2 - 2;
    for (let wx = waveLeft; wx <= waveRight; wx += 2) {
      const wy = wTopY + Math.sin((wx + a.t * waveSpeed) * 0.15) * waveAmp;
      if (wx === waveLeft) ctx.moveTo(cx + wx, wy); else ctx.lineTo(cx + wx, wy);
    }
    ctx.stroke();
  }

  // Turbulence particles
  if (a.agitationEnergy > 0.02) {
    for (const tp of a.turbulenceParticles) {
      const alpha = tp.life * Math.min(0.85, a.agitationEnergy * 1.2);
      ctx.fillStyle = `rgba(90,160,230,${alpha})`;
      const tpX = isCone ? cx + tp.x * bedTopW * 0.5 : cx + tp.x * topW * 0.48;
      ctx.beginPath(); ctx.arc(tpX, bedTopY - 28 + tp.y * 56, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Bloom bubbles (CO2 rising through water)
  for (const bb of a.bloomBubbles) {
    const alpha = bb.life * 0.85;
    const bx = isCone ? cx + bb.x * bedTopW * 0.88 : cx + bb.x * (topW - 16);
    const by = bedTopY - bb.yOffset;
    if (by > dTop + 4 && by < bedTopY + 4) {
      ctx.strokeStyle = `rgba(185,145,55,${alpha})`;
      ctx.fillStyle = `rgba(215,180,90,${alpha * 0.28})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(bx, by, bb.r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  }

  ctx.restore(); // ← end dripper clip

  // Dripper outline + ribs drawn on top of interior content
  ctx.strokeStyle = '#6F4E37'; ctx.lineWidth = 2.5;
  if (isCone) {
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, dTop);
    ctx.lineTo(cx - botW / 2, dTop + dH);
    ctx.lineTo(cx + botW / 2, dTop + dH);
    ctx.lineTo(cx + topW / 2, dTop);
    ctx.closePath(); ctx.stroke();

    ctx.strokeStyle = 'rgba(111,78,55,0.28)'; ctx.lineWidth = 1;
    for (let r = 0; r < 5; r++) {
      const rib = 0.15 + r * 0.16;
      const ribY = dTop + dH * rib;
      const ribW = botW + (topW - botW) * (1 - rib);
      ctx.beginPath();
      ctx.moveTo(cx - ribW / 2 + 5, ribY);
      ctx.lineTo(cx + ribW / 2 - 5, ribY);
      ctx.stroke();
    }
  } else {
    ctx.strokeRect(cx - topW / 2, dTop, topW, dH);
  }

  // ── 6. CUP FILL (before drops so drops appear on top) ────────────────────
  if (fillFrac > 0.005) {
    ctx.beginPath();
    ctx.moveTo(cx - cupW / 2 + shr + 2, fillTop);
    ctx.lineTo(cx - cupW / 2 + 12, cupTop + cupH);
    ctx.lineTo(cx + cupW / 2 - 12, cupTop + cupH);
    ctx.lineTo(cx + cupW / 2 - shr - 2, fillTop);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  }

  // ── 7. DROPS + STREAM (on top of fill, visible in cup) ────────────────────
  const dripGs = a.Q * 1e6;
  ctx.fillStyle = color;

  for (const dr of a.drops) {
    const dropY = dropStartY + dr.y;
    if (dropY > fillTop + 8) continue; // past fill surface

    const distToSurface = fillTop - dropY;
    if (distToSurface < 20 && distToSurface >= -4) {
      // Squash-and-spread on impact
      const sq = Math.max(0, 1 - distToSurface / 20);
      const rx = 3.5 + sq * 8;
      const ry = Math.max(1.5, 5.5 - sq * 4);
      ctx.beginPath();
      ctx.ellipse(cx + dr.x, Math.min(dropY, fillTop - 1), rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx + dr.x, dropY, 3.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 8. CUP WALLS + HANDLE (drawn last — masks anything outside cup) ────────
  ctx.strokeStyle = '#AAA'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - cupW / 2, cupTop);
  ctx.lineTo(cx - cupW / 2 + 12, cupTop + cupH);
  ctx.lineTo(cx + cupW / 2 - 12, cupTop + cupH);
  ctx.lineTo(cx + cupW / 2, cupTop);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + cupW / 2 + 10, cupTop + cupH * 0.45, 18, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  // Cup label below cup
  ctx.fillStyle = '#888'; ctx.font = '12px Inter'; ctx.textAlign = 'center';
  ctx.fillText(`Cup: ${Math.round(a.dripped)}g`, cx, cupTop + cupH + 24);

  // ── 9. CUP SURFACE SHIMMER + RIPPLE ──────────────────────────────────────
  if (fillFrac > 0.005) {
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath();
    const shimLeft = cx - cupW / 2 + shr + 10;
    const shimRight = cx + cupW / 2 - shr - 10;
    for (let sx = shimLeft; sx < shimRight; sx += 2) {
      const sy = fillTop + Math.sin((sx + a.t * 8) * 0.1);
      if (sx === shimLeft) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Ripple ring where stream/drop hits surface
    if (dripGs > 0.5) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.4, dripGs * 0.06)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, fillTop, 7 + dripGs * 2, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ── 10. STEAM ─────────────────────────────────────────────────────────────
  if (a.dripped > 10 && p.temp > 80) {
    for (const sp of a.steamParticles) {
      ctx.fillStyle = `rgba(200,200,200,${sp.life * 0.38})`;
      ctx.beginPath();
      ctx.arc(cx + sp.x, cupTop + sp.y - 5, 3 + (1 - sp.life) * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 11. LABELS ────────────────────────────────────────────────────────────
  ctx.textAlign = 'left'; ctx.font = '12px Inter'; ctx.fillStyle = '#6F4E37';
  const lblX = isCone ? cx + topW / 2 + 10 : cx + topW / 2 + 12;

  if (isCone) {
    // Show actual physical diameters derived from cone geometry
    ctx.fillText(`Bed top: ⌀${s.bedTopDiamMM.toFixed(0)} mm`, lblX, dTop + dH - 20);
    if (wColMM > 0.5) {
      // Water surface diameter: grows as water rises up the cone
      const wSurfDiam = Math.min(
        2 * (s.coneHBedMM + wColMM) * Math.tan(V60_HALF_ANGLE),
        p.diameter
      );
      ctx.fillText(`Water ⌀: ${wSurfDiam.toFixed(0)} mm`, lblX, dTop + 50);
      ctx.fillStyle = '#AAA'; ctx.font = '10px Inter';
      ctx.fillText(`(rim: ${p.diameter} mm)`, lblX, dTop + 64);
      ctx.fillStyle = '#6F4E37'; ctx.font = '12px Inter';
    }
  } else {
    ctx.fillText(`Bed: ${s.bedDepth.toFixed(1)} mm`, lblX, dTop + dH - 20);
    if (wColMM > 0.5) ctx.fillText(`Water: ${wColMM.toFixed(1)} mm`, lblX, dTop + 50);
  }

  if (a.agitationEnergy > 0.05) {
    ctx.fillStyle = '#E85D3A';
    ctx.fillText(`Agitation: ${(a.agitationEnergy * 100).toFixed(0)}%`, lblX, isCone && wColMM > 0.5 ? dTop + 82 : dTop + 68);
  }

  ctx.textAlign = 'center'; ctx.font = '11px Inter'; ctx.fillStyle = '#999';
  const gl = p.grind < 350 ? 'Very Fine' : p.grind < 500 ? 'Fine' : p.grind < 700 ? 'Medium' : p.grind < 900 ? 'Coarse' : 'Very Coarse';
  ctx.fillText(`${gl} grind (${p.grind}µm)`, cx, dTop + dH + 20);
  ctx.fillText(`${p.temp}°C`, cx, dTop - 12);
}

export default function BrewAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { animState, params, constants, isRunning, speed, setSpeed, play, pause, reset } = useBrew();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, canvas.width, canvas.height, animState, params, constants);
  });

  const phaseText = (): { title: string; desc: string } => {
    if (animState.done) return { title: 'Done!', desc: 'Brew complete. Check results below.' };
    if (animState.t === 0) return { title: 'Ready', desc: 'Adjust parameters, then press Brew.' };
    const totalPours = params.pourSchedule?.length ?? params.numPours;
    if (animState.pouring) return {
      title: `Pouring (${animState.curPour}/${totalPours})`,
      desc: `Adding water at ${params.pourRate} ml/s — agitation from impact.`,
    };
    if (animState.wCol * 1000 > 1) return {
      title: 'Draining',
      desc: `Water percolates at ${(animState.Q * 1e6).toFixed(1)} g/s via Darcy's Law.`,
    };
    if (animState.curPour < params.numPours) return {
      title: 'Waiting',
      desc: 'Bed nearly drained. Next pour coming soon.',
    };
    return { title: 'Final drawdown', desc: 'Last drops. Extraction slowing.' };
  };

  const phase = phaseText();
  const min = Math.floor(animState.t / 60);
  const sec = Math.floor(animState.t % 60);
  const bev = Math.max(1, animState.dripped);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm mb-6">
      <h2 className="font-display text-xl mb-1 text-coffee-dark">Live Brew Visualisation</h2>
      <p className="text-xs text-coffee-light mb-4">Physics-accurate animation — water flow, agitation, and extraction follow the real equations</p>

      <div className="flex gap-6 items-start flex-wrap">
        <div className="flex-shrink-0 text-center">
          <canvas ref={canvasRef} width={500} height={680}
            className="rounded-xl" style={{ background: '#FDF9F5' }} />
        </div>

        <div className="flex-1 min-w-[260px]">
          <div className="flex gap-2 flex-wrap mb-3">
            <button onClick={play} disabled={isRunning}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-bg text-coffee-medium font-semibold
                hover:bg-coffee-medium hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default">
              &#9654; Brew
            </button>
            <button onClick={pause} disabled={!isRunning}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-bg text-coffee-medium font-semibold
                hover:bg-coffee-medium hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default">
              &#10074;&#10074; Pause
            </button>
            <button onClick={reset}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-bg text-coffee-medium font-semibold
                hover:bg-coffee-medium hover:text-white transition-colors">
              &#8634; Reset
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-coffee-light mb-4">
            <span>Speed:</span>
            <select value={speed} onChange={e => setSpeed(parseInt(e.target.value))}
              className="px-2 py-1 rounded border border-border text-xs">
              <option value={1}>1x</option>
              <option value={3}>3x</option>
              <option value={10}>10x</option>
              <option value={30}>30x</option>
              <option value={60}>60x</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { val: `${min}:${sec.toString().padStart(2, '0')}`, label: 'Elapsed' },
              { val: `${(animState.Q * 1e6).toFixed(1)} g/s`, label: 'Drip Rate' },
              { val: `${((animState.extracted / params.dose) * 100).toFixed(1)}%`, label: 'Extraction' },
              { val: `${((animState.extracted / bev) * 100).toFixed(2)}%`, label: 'TDS' },
              { val: `${Math.round(animState.poured)} g`, label: 'Poured' },
              { val: `${Math.round(animState.dripped)} g`, label: 'In Cup' },
            ].map(({ val, label }) => (
              <div key={label} className="bg-bg rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-coffee-medium tabular-nums">{val}</div>
                <div className="text-[0.65rem] text-coffee-light font-medium">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg p-3 text-sm border-l-4 border-l-[#E85D3A]"
            style={{ background: 'linear-gradient(135deg, #FFF8F0, #FEF3E8)' }}>
            <span className="font-semibold text-[#E85D3A]">{phase.title}</span>
            {' '}&mdash; {phase.desc}
          </div>
        </div>
      </div>
    </div>
  );
}
