'use client';

import { useBrew } from './BrewContext';
import { PRESETS } from '@/lib/presets';
import { coneBedTopDiameterMM, V60_HALF_ANGLE } from '@/lib/physics';
import type { BrewParams } from '@/lib/types';

function grindLabel(g: number): string {
  if (g < 350) return 'Very Fine';
  if (g < 500) return 'Fine';
  if (g < 700) return 'Medium';
  if (g < 900) return 'Coarse';
  return 'Very Coarse';
}

function Slider({ label, value, unit, min, max, step, paramKey, displayValue }: {
  label: string; value: number; unit: string;
  min: number; max: number; step: number;
  paramKey: keyof BrewParams;
  displayValue?: string;
}) {
  const { updateParam } = useBrew();
  return (
    <div className="mb-3">
      <label className="flex justify-between items-baseline text-sm font-medium mb-1 text-coffee-dark">
        {label}
        <span className="font-semibold text-accent tabular-nums">
          {displayValue ?? `${value} ${unit}`}
        </span>
      </label>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => updateParam(paramKey, parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-sm bg-coffee-cream appearance-none outline-none
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px]
          [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-coffee-medium [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

function SectionTitle({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div className={`text-[0.7rem] font-semibold uppercase tracking-wider text-coffee-light
      ${first ? '' : 'mt-4 pt-3 border-t border-border'} mb-2`}>
      {children}
    </div>
  );
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

export default function ControlsPanel() {
  const { params, setParams } = useBrew();

  const bedTopD = coneBedTopDiameterMM(params.dose, params.diameter);
  const coneHBed = bedTopD / (2 * Math.tan(V60_HALF_ANGLE));
  const coneHTot = (params.diameter / 2) / Math.tan(V60_HALF_ANGLE);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 className="font-display text-xl mb-3 text-coffee-medium">Brew Parameters</h2>

      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {Object.entries(PRESETS).map(([key, { label, params: preset }]) => (
          <button key={key} onClick={() => setParams(preset)}
            className="px-3 py-1.5 text-xs border border-border rounded-full bg-bg
              text-coffee-medium font-medium hover:bg-coffee-medium hover:text-white transition-colors">
            {label}
          </button>
        ))}
      </div>

      <SectionTitle first>Coffee</SectionTitle>
      <Slider label="Coffee Dose" value={params.dose} unit="g" min={10} max={40} step={0.5} paramKey="dose" />
      <Slider label="Grind Size" value={params.grind} unit="µm" min={200} max={1200} step={10} paramKey="grind"
        displayValue={`${grindLabel(params.grind)} (${params.grind} µm)`} />

      <SectionTitle>Water</SectionTitle>
      <Slider label="Total Water" value={params.waterTotal} unit="g" min={150} max={600} step={5} paramKey="waterTotal" />
      <Slider label="Temperature" value={params.temp} unit="°C" min={70} max={100} step={0.5} paramKey="temp" />

      <SectionTitle>Pouring</SectionTitle>
      <Slider label="Pour Rate" value={params.pourRate} unit="ml/s" min={1} max={12} step={0.1} paramKey="pourRate"
        displayValue={`${params.pourRate.toFixed(1)} ml/s`} />

      {/* Pour schedule — read-only display */}
      {params.pourSchedule && params.pourSchedule.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-coffee-dark mb-1.5">Pour Schedule</div>
          <div className="space-y-1">
            {params.pourSchedule.map((entry, i) => {
              const cumulative = params.pourSchedule!
                .slice(0, i + 1)
                .reduce((acc, e) => acc + e.amount, 0);
              const dur = entry.amount / params.pourRate;
              return (
                <div key={i} className="flex items-center gap-2 text-xs bg-bg rounded-md px-2.5 py-1.5 border border-border">
                  <span className="font-semibold text-coffee-medium w-4">{i + 1}</span>
                  <span className="text-coffee-light w-10">@ {fmtTime(entry.startTime)}</span>
                  <span className="text-coffee-dark font-medium">{entry.amount} g</span>
                  <span className="text-coffee-light text-[0.65rem]">
                    ({dur.toFixed(1)}s pour · {cumulative} g total)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SectionTitle>Dripper — Hario V60 02</SectionTitle>
      <div className="text-xs text-coffee-light leading-relaxed bg-bg rounded-lg p-2.5 border border-border mb-2">
        <div className="font-semibold text-coffee-medium mb-0.5">Cone geometry (60° opening)</div>
        <div>Top rim: <span className="font-medium text-coffee-dark">{params.diameter} mm ⌀</span></div>
        <div>Bed top: <span className="font-medium text-coffee-dark">{bedTopD.toFixed(0)} mm ⌀</span>
          {' '}<span className="text-[0.65rem]">({coneHBed.toFixed(0)} mm from tip)</span></div>
        <div>Cone height: <span className="font-medium text-coffee-dark">{coneHTot.toFixed(0)} mm</span>
          {' '}tip → rim</div>
        <div className="text-[0.65rem] italic mt-1 opacity-80">
          Water surface ⌀ grows from {bedTopD.toFixed(0)} → {params.diameter} mm per pour
        </div>
      </div>
    </div>
  );
}
