'use client';

import { useBrew } from './BrewContext';

function qualityInfo(ey: number, tds: number): { label: string; cls: string } {
  if (ey >= 18 && ey <= 22 && tds >= 1.2 && tds <= 1.45) return { label: 'Ideal', cls: 'bg-green-100 text-green-800' };
  if (ey < 18 && tds < 1.2) return { label: 'Weak & Under-Extracted', cls: 'bg-yellow-100 text-yellow-800' };
  if (ey < 18) return { label: 'Under-Extracted', cls: 'bg-yellow-100 text-yellow-800' };
  if (ey > 22 && tds > 1.45) return { label: 'Strong & Over-Extracted', cls: 'bg-red-100 text-red-800' };
  if (ey > 22) return { label: 'Over-Extracted', cls: 'bg-red-100 text-red-800' };
  if (tds < 1.2) return { label: 'Weak', cls: 'bg-gray-100 text-gray-700' };
  if (tds > 1.45) return { label: 'Strong', cls: 'bg-gray-200 text-gray-700' };
  return { label: 'Good', cls: 'bg-green-100 text-green-800' };
}

function Metric({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="bg-bg rounded-xl p-3 text-center">
      <div className="text-2xl font-bold text-coffee-medium tabular-nums">
        {value}<span className="text-sm font-normal">{unit}</span>
      </div>
      <div className="text-xs text-coffee-light font-medium mt-0.5">{label}</div>
    </div>
  );
}

export default function ResultsSummary() {
  const { result } = useBrew();
  const min = Math.floor(result.brewTime / 60);
  const sec = Math.floor(result.brewTime % 60);
  const q = qualityInfo(result.EY, result.TDS);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-display text-lg mb-1 text-coffee-dark">Brew Summary</h3>
      <p className="text-xs text-coffee-light mb-4">Instant results from the simulation</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Metric value={`${min}:${sec.toString().padStart(2, '0')}`} unit="" label="Brew Time" />
        <Metric value={result.EY.toFixed(1)} unit="%" label="Extraction Yield" />
        <Metric value={result.TDS.toFixed(2)} unit="%" label="TDS" />
        <Metric value={Math.round(result.beverageWeight).toString()} unit="g" label="Beverage" />
      </div>
      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${q.cls}`}>
          {q.label}
        </span>
      </div>
    </div>
  );
}
