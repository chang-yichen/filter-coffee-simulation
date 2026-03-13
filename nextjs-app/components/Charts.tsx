'use client';

import { useState } from 'react';
import { useBrew } from './BrewContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart,
  ScatterChart, Scatter, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import InfoModal from './InfoModal';

function Card({
  title, subtitle, infoTitle, infoContent, children,
}: {
  title: string; subtitle: string;
  infoTitle: string; infoContent: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <h3 className="font-display text-lg text-coffee-dark">{title}</h3>
        <button
          onClick={() => setOpen(true)}
          title="Why does this matter?"
          className="flex-shrink-0 w-6 h-6 rounded-full border border-coffee-light text-coffee-light hover:border-coffee-medium hover:text-coffee-medium text-xs font-bold leading-none flex items-center justify-center transition-colors mt-0.5"
        >
          i
        </button>
      </div>
      <p className="text-xs text-coffee-light mb-4">{subtitle}</p>
      {children}
      {open && (
        <InfoModal title={infoTitle} onClose={() => setOpen(false)}>
          {infoContent}
        </InfoModal>
      )}
    </div>
  );
}

const axisStyle = { fontSize: 11, fill: '#6F4E37' };
const gridStroke = 'rgba(196,168,130,0.2)';

export default function Charts() {
  const { result } = useBrew();

  const lineData = result.timeData.map((t, i) => ({
    t: Math.round(t),
    drip: +result.dripRateData[i].toFixed(2),
    water: +result.waterHeightData[i].toFixed(2),
    ey: +result.eyData[i].toFixed(2),
    agit: +(result.agitationData[i] * 100).toFixed(1),
  }));

  return (
    <>
      <Card
        title="Drip Rate Over Time"
        subtitle="Darcy's Law — rises during pours, decays exponentially during drawdown"
        infoTitle="Drip Rate — Why It Matters"
        infoContent={
          <>
            <p>
              The drip rate is governed by <strong>Darcy's Law</strong>: Q = k·A·(ρgh) / (μ·L).
              Every variable you control in brewing — grind size, water temperature, bed depth — directly
              appears in this equation.
            </p>
            <p>
              <strong>Why the peaks and valleys?</strong> Each time you pour, the water column height h
              rises, increasing pressure and driving a faster drip. Once pouring stops, h falls and drip
              rate decays <em>exponentially</em> — because Q ∝ h and h itself falls proportional to Q.
            </p>
            <ul>
              <li><strong>Coarser grind</strong> → higher permeability k → faster drain, shorter brew time.</li>
              <li><strong>Hotter water</strong> → lower viscosity μ → faster flow. Water at 95°C is nearly
                3× less viscous than at 20°C.</li>
              <li><strong>Deeper bed</strong> (more coffee, same diameter) → more resistance L → slower drip.</li>
            </ul>
            <p>
              Gagné notes that small fines (particles &lt; 0.1 mm) have a disproportionate effect:
              they block the smallest pores and dominate hydraulic resistance far more than their
              volume would suggest. This is why grind uniformity matters more than average grind size.
            </p>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={lineData}>
            <CartesianGrid stroke={gridStroke} />
            <XAxis dataKey="t" tick={axisStyle} label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, style: axisStyle }} />
            <YAxis tick={axisStyle} label={{ value: 'g/s', angle: -90, position: 'insideLeft', style: axisStyle }} />
            <Tooltip />
            <Area type="monotone" dataKey="drip" stroke="#4A90D9" fill="rgba(74,144,217,0.1)" strokeWidth={2} dot={false} name="Drip Rate" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Water Level in Dripper"
        subtitle="Free water above bed + bed depth — total visible level (mm). Baseline = coffee bed depth"
        infoTitle="Water Level — Why It Matters"
        infoContent={
          <>
            <p>
              The water column height h above the coffee bed is the <strong>pressure head</strong> that
              drives flow through the bed. A taller column means more weight pressing down, proportionally
              increasing the drip rate.
            </p>
            <p>
              <strong>The V60 cone changes things:</strong> unlike a cylinder where water surface area
              is constant, in a cone A(h) = π·tan²(θ)·(h_bed + h)². This means pouring the same amount
              of water raises the level <em>more</em> near the top of the cone (larger radius) than at
              the bottom. Near the end of a drawdown, as h drops toward the bed surface,
              the cone narrows and the rate of level drop accelerates.
            </p>
            <ul>
              <li>Ideal range: ~5–20 mm above the bed during drawdown, per Gagné.</li>
              <li>Below ~10 mm: risk of the bed drying out unevenly (channeling).</li>
              <li>Above ~25 mm: high pressure can compact fines, spiking resistance mid-brew.</li>
            </ul>
            <p>
              This is why Hoffmann's pour schedule spaces pours to keep the level in
              a controlled range rather than dumping all water at once.
            </p>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={lineData}>
            <CartesianGrid stroke={gridStroke} />
            <XAxis dataKey="t" tick={axisStyle} label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, style: axisStyle }} />
            <YAxis tick={axisStyle} label={{ value: 'mm', angle: -90, position: 'insideLeft', style: axisStyle }} />
            <Tooltip />
            <Area type="monotone" dataKey="water" stroke="#4A90D9" fill="rgba(74,144,217,0.15)" strokeWidth={2} dot={false} name="Height (mm)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Extraction Over Time"
        subtitle="Cumulative extraction — fast at first, then slowing as solubles deplete"
        infoTitle="Extraction Curve — Why It Matters"
        infoContent={
          <>
            <p>
              Extraction follows the <strong>Noyes-Whitney equation</strong>: dm/dt = A·(D/L)·(C_sat − C_sol).
              The rate is proportional to the concentration gradient — how far below saturation the
              surrounding water is.
            </p>
            <p>
              <strong>Why it decelerates:</strong> As more solubles dissolve, C_sol rises toward C_sat
              and the driving force shrinks. Early in the brew you're extracting the most soluble,
              lightest compounds (acids, some sugars); later you pull heavier, more complex ones.
            </p>
            <ul>
              <li><strong>Target 18–22% EY</strong> for balanced flavor — below 18% = under-extracted
                (sour, sharp); above 22% = over-extracted (bitter, harsh).</li>
              <li>Finer grind → more surface area A → steeper early curve, but also slower flow
                (competing effects).</li>
              <li>Higher temperature → higher diffusion coefficient D → faster extraction
                of all compounds, but also shifts <em>which</em> compounds dominate.</li>
            </ul>
            <p>
              Gagné notes that because different chemicals have different diffusion coefficients,
              temperature changes the <em>flavor profile</em>, not just extraction speed.
              Brewing at 85°C vs 95°C can produce a noticeably different tasting cup even
              at identical EY.
            </p>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <CartesianGrid stroke={gridStroke} />
            <XAxis dataKey="t" tick={axisStyle} label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, style: axisStyle }} />
            <YAxis tick={axisStyle} domain={[0, 28]} label={{ value: 'EY %', angle: -90, position: 'insideLeft', style: axisStyle }} />
            <Tooltip />
            <Line type="monotone" dataKey="ey" stroke="#8B5E3C" strokeWidth={2} dot={false} name="EY %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Coffee Brewing Control Chart"
        subtitle="Where your brew lands on Lockhart's classic chart"
        infoTitle="The Brewing Control Chart — Why It Matters"
        infoContent={
          <>
            <p>
              This chart was developed by <strong>E.E. Lockhart</strong> in the 1950s at MIT for the
              Coffee Brewing Institute. It maps two independent measurements that together
              describe both <em>how much</em> coffee dissolved (EY) and <em>how strong</em>
              the cup is (TDS).
            </p>
            <p>
              <strong>The green zone (18–22% EY, 1.2–1.45% TDS)</strong> is where the majority
              of tasters in Lockhart's studies rated coffee as balanced and pleasant.
            </p>
            <ul>
              <li><strong>EY &lt; 18%</strong> (left of zone): under-extracted — sour, sharp, acidic.
                Fix: finer grind, higher temp, or longer brew time.</li>
              <li><strong>EY &gt; 22%</strong> (right of zone): over-extracted — bitter, astringent, harsh.
                Fix: coarser grind, lower temp, or shorter time.</li>
              <li><strong>TDS &lt; 1.2%</strong> (below zone): too weak — watery, thin body.
                Fix: use more coffee (lower brew ratio).</li>
              <li><strong>TDS &gt; 1.45%</strong> (above zone): too strong — heavy, overwhelming.
                Fix: use less coffee or add water after brewing.</li>
            </ul>
            <p>
              Crucially, EY and TDS can be adjusted <em>independently</em>: you can
              hit 20% EY but still be too weak or too strong by changing the
              dose-to-water ratio. This chart makes that trade-off visible.
            </p>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke={gridStroke} />
            <XAxis type="number" dataKey="x" domain={[14, 28]} tick={axisStyle}
              label={{ value: 'Extraction Yield (%)', position: 'insideBottom', offset: -5, style: axisStyle }} />
            <YAxis type="number" dataKey="y" domain={[0.8, 1.8]} tick={axisStyle}
              label={{ value: 'TDS (%)', angle: -90, position: 'insideLeft', style: axisStyle }} />
            <ReferenceArea x1={18} x2={22} y1={1.2} y2={1.45} fill="rgba(212,237,218,0.5)" stroke="#28a745" strokeWidth={1} />
            <Tooltip />
            <Scatter data={[{ x: result.EY, y: result.TDS }]} fill="#E85D3A" name="Your Brew" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
