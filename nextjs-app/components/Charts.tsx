'use client';

import { useBrew } from './BrewContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart,
  ScatterChart, Scatter, ReferenceArea, ResponsiveContainer,
} from 'recharts';

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-display text-lg mb-0.5 text-coffee-dark">{title}</h3>
      <p className="text-xs text-coffee-light mb-4">{subtitle}</p>
      {children}
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
      <Card title="Drip Rate Over Time" subtitle="Darcy's Law — rises during pours, decays exponentially during drawdown">
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

      <Card title="Water Level in Dripper" subtitle="Free water above bed + bed depth — total visible level (mm). Baseline = coffee bed depth">
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

      <Card title="Extraction Over Time" subtitle="Cumulative extraction — fast at first, then slowing as solubles deplete">
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

      <Card title="Coffee Brewing Control Chart" subtitle="Where your brew lands on Lockhart's classic chart">
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
