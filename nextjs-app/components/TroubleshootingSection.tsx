'use client';

import { useBrew } from './BrewContext';

interface Scenario {
  id: string;
  label: string;
  taste: string;
  color: string;
  dot: string;
  match: (ey: number, tds: number) => boolean;
  causes: string[];
  fixes: Array<{ param: string; change: string; why: string }>;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'ideal',
    label: 'Well Balanced',
    taste: 'Sweet, round, pleasant acidity — all compounds in harmony',
    color: 'bg-green-50 border-green-300',
    dot: 'bg-green-500',
    match: (ey, tds) => ey >= 18 && ey <= 22 && tds >= 1.2 && tds <= 1.45,
    causes: [],
    fixes: [],
  },
  {
    id: 'under-weak',
    label: 'Under-extracted & Weak',
    taste: 'Sour, sharp, hollow, watery — very few compounds dissolved',
    color: 'bg-yellow-50 border-yellow-300',
    dot: 'bg-yellow-500',
    match: (ey, tds) => ey < 18 && tds < 1.2,
    causes: [
      'Grind too coarse — low surface area, fast flow, short contact time',
      'Temperature too low — slower diffusion, less dissolution',
      'Brew ratio too high — too much water for the dose used',
    ],
    fixes: [
      { param: 'Grind', change: 'Finer', why: 'More surface area + slower flow = more extraction' },
      { param: 'Temp', change: 'Higher', why: 'Faster diffusion, heavier compounds dissolve' },
      { param: 'Dose', change: 'More coffee', why: 'Lowers the brew ratio, increases TDS' },
      { param: 'Pour pattern', change: 'Circular + even bloom', why: 'Ensures all grounds are wetted' },
    ],
  },
  {
    id: 'under',
    label: 'Under-extracted',
    taste: 'Sour, sharp, lacks sweetness — light acids extracted but not the balanced compounds',
    color: 'bg-yellow-50 border-yellow-300',
    dot: 'bg-yellow-400',
    match: (ey, tds) => ey < 18 && tds >= 1.2,
    causes: [
      'Grind too coarse — water moves too quickly through the bed',
      'Temperature too low — slower molecular diffusion, heavy compounds left behind',
      'Too few pours — concentration gradient not refreshed enough',
      'Fresh beans without sufficient bloom time — CO2 repels water in early pours',
    ],
    fixes: [
      { param: 'Grind', change: 'Finer', why: 'More surface area, more contact time' },
      { param: 'Temp', change: 'Higher (try 93–100°C)', why: 'Heavier sweetness compounds need heat to dissolve' },
      { param: 'Bloom', change: 'Even wetting + rested beans', why: 'Ensures full CO2 degassing before main pours' },
      { param: 'Pour schedule', change: 'More pours', why: 'Each pour resets the concentration gradient' },
    ],
  },
  {
    id: 'over-strong',
    label: 'Over-extracted & Strong',
    taste: 'Bitter, harsh, astringent, heavy — unpleasant compounds fully dissolved',
    color: 'bg-red-50 border-red-300',
    dot: 'bg-red-500',
    match: (ey, tds) => ey > 22 && tds > 1.45,
    causes: [
      'Grind too fine — very high surface area extracts everything including harsh compounds',
      'Temperature too high — over-extracts bitter melanoidins',
      'Dose too high for the water amount — high TDS + long contact time',
    ],
    fixes: [
      { param: 'Grind', change: 'Coarser', why: 'Less surface area, faster drawdown, less extraction' },
      { param: 'Temp', change: 'Lower (try 85–90°C)', why: 'Harsh bitter compounds extract less at lower temps' },
      { param: 'Water', change: 'More water (higher ratio)', why: 'Lowers TDS and reduces contact concentration' },
    ],
  },
  {
    id: 'over',
    label: 'Over-extracted',
    taste: 'Bitter, dry, harsh finish — too many of the unpleasant late-extraction compounds',
    color: 'bg-red-50 border-red-300',
    dot: 'bg-red-400',
    match: (ey, tds) => ey > 22 && tds < 1.45,
    causes: [
      'Grind too fine — slow flow, long contact time, all compounds extracted',
      'Temperature too high — harsh compounds become soluble at high temp',
      'Too much agitation — turbulence increases contact and extraction rate',
    ],
    fixes: [
      { param: 'Grind', change: 'Coarser', why: 'Faster flow, shorter contact time' },
      { param: 'Temp', change: 'Lower', why: 'Bitter compounds are less soluble at lower temps' },
      { param: 'Pour rate', change: 'Gentler (lower ml/s)', why: 'Less agitation, less turbulence' },
    ],
  },
  {
    id: 'weak',
    label: 'Too Weak (low TDS)',
    taste: 'Watery, thin — the right extraction level but not enough coffee dissolved per cup',
    color: 'bg-blue-50 border-blue-300',
    dot: 'bg-blue-400',
    match: (ey, tds) => tds < 1.2 && ey >= 18 && ey <= 22,
    causes: [
      'Brew ratio too high — too much water for the dose (e.g. 1:20 or more)',
      'Beverage weight higher than intended due to long brew',
    ],
    fixes: [
      { param: 'Dose', change: 'More coffee (same water)', why: 'Lowers ratio, increases TDS without changing EY much' },
      { param: 'Water', change: 'Less water (same dose)', why: 'Concentrates the cup' },
    ],
  },
  {
    id: 'strong',
    label: 'Too Strong (high TDS)',
    taste: 'Heavy, intense, overwhelming — the flavors are correct but too concentrated',
    color: 'bg-purple-50 border-purple-300',
    dot: 'bg-purple-400',
    match: (ey, tds) => tds > 1.45 && ey >= 18 && ey <= 22,
    causes: [
      'Brew ratio too low — too much coffee for the water (e.g. 1:13 or less)',
    ],
    fixes: [
      { param: 'Dose', change: 'Less coffee (same water)', why: 'Raises ratio, reduces TDS' },
      { param: 'Water', change: 'More water', why: 'Dilutes the cup — or add water after brewing (bypass)' },
    ],
  },
];

export default function TroubleshootingSection() {
  const { result } = useBrew();
  const { EY, TDS } = result;

  const active = SCENARIOS.find(s => s.match(EY, TDS)) ?? SCENARIOS[0];

  return (
    <section className="mb-8">
      <h2 className="font-display text-xl md:text-2xl text-center mb-2">Troubleshooting Guide</h2>
      <p className="text-center text-sm text-coffee-light mb-6">
        Adjust your parameters above and watch this update live
      </p>

      {/* Live diagnosis */}
      <div className={`rounded-2xl border p-5 mb-6 ${active.color}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${active.dot}`} />
          <h3 className="font-display text-lg text-coffee-dark">{active.label}</h3>
          <span className="ml-auto text-xs font-mono text-coffee-light tabular-nums">
            EY {EY.toFixed(1)}% · TDS {TDS.toFixed(2)}%
          </span>
        </div>
        <p className="text-sm text-gray-600 italic mb-4">&ldquo;{active.taste}&rdquo;</p>

        {active.causes.length > 0 && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-coffee-light mb-2">Likely causes</div>
            <ul className="text-sm text-gray-700 space-y-1 mb-4 pl-4">
              {active.causes.map((c, i) => <li key={i} className="list-disc">{c}</li>)}
            </ul>
            <div className="text-xs font-semibold uppercase tracking-wider text-coffee-light mb-2">Try these adjustments</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {active.fixes.map((f, i) => (
                <div key={i} className="bg-white/70 rounded-lg p-2.5 border border-white">
                  <div className="text-sm font-semibold text-coffee-dark">
                    {f.param} → <span className="text-accent">{f.change}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.why}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {active.id === 'ideal' && (
          <p className="text-sm text-green-700 font-medium">
            Your brew is in the ideal zone. Try adjusting the grind or temperature to explore how the flavor profile shifts while staying balanced.
          </p>
        )}
      </div>

      {/* Reference table — all scenarios */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <h3 className="font-display text-lg text-coffee-dark mb-1">All Scenarios at a Glance</h3>
        <p className="text-xs text-coffee-light mb-4">
          EY (extraction yield) and TDS (strength) are independent axes — you can fix each separately
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-coffee-light">Scenario</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-coffee-light">EY</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-coffee-light">TDS</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-coffee-light">Primary fix</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map(s => (
                <tr key={s.id} className={`border-b border-border/50 ${s.id === active.id ? 'bg-amber-50' : ''}`}>
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                      <span className="font-medium text-coffee-dark">{s.label}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-coffee-medium font-mono text-xs">
                    {s.id === 'ideal' ? '18–22%' : s.id.startsWith('under') ? '<18%' : s.id.startsWith('over') ? '>22%' : '18–22%'}
                  </td>
                  <td className="py-2 pr-4 text-coffee-medium font-mono text-xs">
                    {s.id === 'ideal' ? '1.2–1.45%' : s.id === 'under-weak' || s.id === 'weak' ? '<1.2%' : s.id === 'over-strong' || s.id === 'strong' ? '>1.45%' : '1.2–1.45%'}
                  </td>
                  <td className="py-2 text-gray-600 text-xs">
                    {s.fixes[0] ? `${s.fixes[0].param} → ${s.fixes[0].change}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-bg border border-border text-xs text-coffee-light leading-relaxed">
          <strong className="text-coffee-dark">Key principle:</strong> Grind size and temperature control <em>EY</em> (extraction yield — how much dissolved).
          Brew ratio (dose ÷ water) controls <em>TDS</em> (strength — how concentrated). Adjust them independently to dial in your brew.
        </div>
      </div>
    </section>
  );
}
