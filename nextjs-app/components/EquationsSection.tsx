function EqCard({ title, tagline, eqLabel, equation, children, analogy }: {
  title: string; tagline: string; eqLabel: string; equation: React.ReactNode;
  children: React.ReactNode; analogy: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-5">
      <h3 className="font-display text-xl text-coffee-dark mb-1">{title}</h3>
      <p className="text-sm text-coffee-medium italic mb-3">{tagline}</p>
      <div className="bg-bg rounded-lg p-4 text-center text-xl my-4 border-l-4 border-coffee-light font-serif">
        <span className="block text-[0.65rem] uppercase tracking-wider text-coffee-light font-sans mb-2">{eqLabel}</span>
        {equation}
      </div>
      <div className="text-sm text-gray-600 leading-relaxed [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_strong]:text-coffee-dark">
        {children}
      </div>
      <div className="mt-4 p-3 rounded-lg text-sm border-l-4 border-l-[#E85D3A]"
        style={{ background: 'linear-gradient(135deg, #FFF8F0, #FEF3E8)' }}>
        <span className="font-semibold text-[#E85D3A]">Analogy: </span>{analogy}
      </div>
    </div>
  );
}

export default function EquationsSection() {
  return (
    <section className="mt-4">
      <h2 className="font-display text-2xl text-center mb-6">The Equations, Explained Simply</h2>

      <EqCard title="1. Darcy's Law — How Water Flows Through Coffee"
        tagline="The fundamental equation of percolation brewing"
        eqLabel="Darcy's Law"
        equation={<>Q = (k &middot; A) / (&mu; &middot; L) &middot; (&rho; &middot; g &middot; h)</>}
        analogy="The coffee bed is like a packed sponge. Coarse grounds are a loose sponge (water runs through); fine grounds are dense (water squeezes through tiny gaps). Hot water is like thin oil; cold water is thicker, like honey.">
        <p>This predicts the <strong>drip rate Q</strong> — how fast coffee flows out:</p>
        <ul>
          <li><strong>k (permeability)</strong> — How easily water passes through. Coarser = bigger gaps = faster.</li>
          <li><strong>A (area)</strong> — Cross-section of the dripper.</li>
          <li><strong>&mu; (viscosity)</strong> — How &quot;thick&quot; the water. Hotter = thinner = faster flow.</li>
          <li><strong>L (bed depth)</strong> — Deeper bed = slower flow.</li>
          <li><strong>&rho;&middot;g&middot;h (pressure)</strong> — Weight of water column. Taller = more pressure = faster.</li>
        </ul>
      </EqCard>

      <EqCard title="2. Brew Time — How Long Until the Last Drop"
        tagline="Derived from Darcy's Law for a cylindrical dripper"
        eqLabel="Total Brew Time"
        equation={<>T = (&nu; &middot; L) / (k &middot; g) &middot; ln(R &middot; &rho;<sub>c</sub> / &rho;<sub>w</sub>)</>}
        analogy="Draining a bathtub through gravel: making the tub wider doesn't change drain time — more area means faster drainage but also more water. Only gravel thickness matters.">
        <ul>
          <li><strong>&nu;</strong> — Kinematic viscosity. Hotter &rarr; lower &rarr; faster brew.</li>
          <li><strong>L</strong> — Bed depth. Deeper = longer brew.</li>
          <li><strong>k</strong> — Permeability. Coarser grind = shorter brew.</li>
          <li><strong>R</strong> — Brew ratio. Inside a logarithm, so the effect is gentle.</li>
        </ul>
        <p className="mt-2"><strong>Key insight:</strong> dripper width doesn&apos;t appear! Only bed depth controls time.</p>
      </EqCard>

      <EqCard title="3. Noyes-Whitney — How Coffee Dissolves"
        tagline="The rate at which flavor compounds leave the grounds"
        eqLabel="Dissolution Rate"
        equation={<>dm/dt = A &middot; (D / L) &middot; (C<sub>sat</sub> &minus; C<sub>sol</sub>)</>}
        analogy="Dissolving sugar: powdered sugar (fine grind) vanishes fast; a sugar cube (coarse) is slow. Stirring helps — just as flowing water keeps 'refreshing' the grounds.">
        <ul>
          <li><strong>A (surface area)</strong> — Finer grind = massively more surface = faster extraction.</li>
          <li><strong>D (diffusion coefficient)</strong> — Higher temp &rarr; higher D &rarr; faster extraction.</li>
          <li><strong>C<sub>sat</sub> &minus; C<sub>sol</sub></strong> — Extraction slows as water gets concentrated.</li>
        </ul>
      </EqCard>

      <EqCard title="4. Einstein-Smoluchowski — Temperature & Diffusion"
        tagline="Why hotter water extracts more and different flavors"
        eqLabel="Diffusion Coefficient"
        equation={<>D = &mu;<sub>p</sub> &middot; k<sub>B</sub> &middot; T</>}
        analogy="Molecules in water are like people in a crowd. Cold = shuffling slowly. Hot = moving fast, bumping energetically — everything spreads and mixes quickly.">
        <p>Temperature has a <strong>double effect</strong>: (1) dissolves compounds faster at the surface, and (2) transports them away faster via diffusion. Different molecules have different mobilities — that&apos;s why temperature changes the <em>flavor profile</em>, not just speed.</p>
      </EqCard>

      <EqCard title="5. Extraction Yield — Measuring Your Brew"
        tagline="The fraction of coffee that ended up in your cup"
        eqLabel="Extraction Yield"
        equation={<>EY = (C &middot; B) / D</>}
        analogy="Starting with 20g of coffee and extracting 4g of solubles = 20% yield. You can't get everything out — the last compounds taste harsh.">
        <p><strong>C</strong> = TDS concentration, <strong>B</strong> = beverage weight, <strong>D</strong> = coffee dose.</p>
        <p className="mt-1">Ideal: <strong>18–22%</strong>. Below 18% = sour (under-extracted). Above 22% = bitter (over-extracted).</p>
      </EqCard>

      <EqCard title="6. Kinematic Viscosity — Temperature & Flow"
        tagline="Why hotter water flows faster through the bed"
        eqLabel="Kinematic Viscosity"
        equation={<>&nu; = &mu; / &rho;</>}
        analogy="Cold honey pours slowly; warm honey pours easily. Water does the same — less dramatically, but at the scale of tiny gaps between coffee grounds, it matters a lot.">
        <p>As temperature rises, viscosity drops significantly. <strong>Flow speeds up ~20% from 80&deg;C to 95&deg;C.</strong> Brew cooler? Grind coarser to compensate.</p>
      </EqCard>
    </section>
  );
}
