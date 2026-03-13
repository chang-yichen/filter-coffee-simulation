'use client';

import { useState } from 'react';
import InfoModal from './InfoModal';

function EqCard({ title, tagline, eqLabel, equation, children, analogy, infoTitle, infoContent }: {
  title: string; tagline: string; eqLabel: string; equation: React.ReactNode;
  children: React.ReactNode; analogy: string;
  infoTitle: string; infoContent: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-display text-xl text-coffee-dark">{title}</h3>
        <button
          onClick={() => setOpen(true)}
          title="Learn more from the physics book"
          className="flex-shrink-0 w-6 h-6 rounded-full border border-coffee-light text-coffee-light hover:border-coffee-medium hover:text-coffee-medium text-xs font-bold leading-none flex items-center justify-center transition-colors mt-1"
        >
          i
        </button>
      </div>
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
      {open && (
        <InfoModal title={infoTitle} onClose={() => setOpen(false)}>
          {infoContent}
        </InfoModal>
      )}
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
        analogy="The coffee bed is like a packed sponge. Coarse grounds are a loose sponge (water runs through); fine grounds are dense (water squeezes through tiny gaps). Hot water is like thin oil; cold water is thicker, like honey."
        infoTitle="Darcy's Law — Deep Dive"
        infoContent={
          <>
            <p>
              Henry Darcy (1856) discovered this law studying water flow through sand beds in Dijon,
              France. The same equation governs coffee percolation exactly.
            </p>
            <p>
              <strong>Permeability k</strong> is the trickiest term. Gagné explains that it is dominated
              by the <em>10th percentile particle diameter D₁₀</em>, not the average size.
              Fine particles (below ~0.1 mm) block the smallest pores and create
              disproportionately high resistance — far more than their volume would suggest.
              This is the core reason grind uniformity is so important.
            </p>
            <p>
              The Kozeny-Carman approximation relates k to particle diameter and bed porosity:
              k ≈ f_s · D₁₀². Changing grind size by 10% changes permeability by ~20%,
              and brew time by ~20%.
            </p>
            <ul>
              <li>Temperature 95°C vs 60°C: μ drops from ~0.47 to ~0.32 mPa·s — nearly 50% faster flow.</li>
              <li>Bed depth L doubles → brew time doubles (linear, not squared).</li>
              <li>Dripper width doesn't directly appear: see the Brew Time equation for why.</li>
            </ul>
          </>
        }
      >
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
        analogy="Draining a bathtub through gravel: making the tub wider doesn't change drain time — more area means faster drainage but also more water. Only gravel thickness matters."
        infoTitle="Brew Time — The Key Insight"
        infoContent={
          <>
            <p>
              This equation is derived by integrating Darcy's Law over the full drawdown.
              The remarkable result: <strong>dripper width A cancels out entirely.</strong>
            </p>
            <p>
              Why? A wider dripper flows faster (larger A in Darcy's Law), but it also holds
              proportionally more water at the same height. The two effects cancel perfectly
              for a cylinder, leaving only bed depth L in the equation.
            </p>
            <p>
              <strong>For the V60 cone, it's different:</strong> near the tip, the cone narrows
              and the drip rate accelerates relative to volume remaining. The cone drains faster
              at the end than a cylinder would — this is part of why V60 can produce very clean,
              bright cups: the final extraction happens quickly at low water levels.
            </p>
            <ul>
              <li>Brew ratio R appears inside a logarithm — its effect is gentle. Doubling R (2× more water) only adds ~ln(2) ≈ 70% more time.</li>
              <li>ν (kinematic viscosity) scales directly with time. Brewing at 80°C instead of 95°C adds ~40-50% more brew time.</li>
              <li>To keep brew time constant when brewing cooler: grind coarser to increase k.</li>
            </ul>
          </>
        }
      >
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
        analogy="Dissolving sugar: powdered sugar (fine grind) vanishes fast; a sugar cube (coarse) is slow. Stirring helps — just as flowing water keeps 'refreshing' the grounds."
        infoTitle="Noyes-Whitney — Dissolution Physics"
        infoContent={
          <>
            <p>
              Noyes and Whitney (1897) showed that dissolution rate is proportional to
              surface area and the ratio D/L — diffusivity divided by the thickness of
              the concentration boundary layer at the particle surface.
            </p>
            <p>
              <strong>For coffee:</strong> a fine grind can have 30× more surface area than a
              coarse grind from the same dose, because surface area scales as 1/diameter² while
              particle count scales as diameter³ — a cubic relationship that makes grind size
              the dominant lever for extraction rate.
            </p>
            <p>
              The term <strong>(C_sat − C_sol)</strong> is the concentration gradient — the
              "driving force." Early in the brew, C_sol ≈ 0, so the gradient is maximal and
              extraction is fast. As C_sol approaches C_sat, the gradient collapses and
              extraction self-limits. This is why the extraction curve decelerates even
              if water keeps flowing.
            </p>
            <ul>
              <li>Immersion brews (French Press, AeroPress) hit this limit faster because
                the water isn't refreshed — percolation continuously supplies fresh water.</li>
              <li>Multiple pours help by regularly resetting C_sol near zero at the surface.</li>
            </ul>
          </>
        }
      >
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
        analogy="Molecules in water are like people in a crowd. Cold = shuffling slowly. Hot = moving fast, bumping energetically — everything spreads and mixes quickly."
        infoTitle="Temperature & Diffusion — Deep Dive"
        infoContent={
          <>
            <p>
              Einstein (1905) and Smoluchowski derived this independently: the diffusion
              coefficient D equals the molecule's mobility μ_p times thermal energy k_B·T.
              As temperature T rises, molecules move faster and D increases.
            </p>
            <p>
              <strong>The key insight from Gagné:</strong> each flavor compound has its own
              mobility μ_p. Lighter, simpler acids (like chlorogenic acid) diffuse faster
              than heavier melanoidins and complex aromatic compounds. This means
              temperature changes the <em>relative</em> extraction rates of different compounds,
              not just the overall speed.
            </p>
            <p>
              Between 85°C and 95°C, diffusion coefficients change by roughly 15%.
              This shift:
            </p>
            <ul>
              <li>At higher temps: more balanced extraction, heavier body, more bitter compounds extracted.</li>
              <li>At lower temps: brighter, more acidic, lighter profile — even at the same EY.</li>
              <li>Temperature has a <em>double effect</em>: faster dissolution (Noyes-Whitney D) and
                faster transport away from the surface (this equation).</li>
            </ul>
            <p>
              This is why Hoffmann's 30g recipe uses 100°C — for high-quality lightly roasted beans,
              full extraction temperature is needed to dissolve heavier sweetness compounds.
            </p>
          </>
        }
      >
        <p>Temperature has a <strong>double effect</strong>: (1) dissolves compounds faster at the surface, and (2) transports them away faster via diffusion. Different molecules have different mobilities — that&apos;s why temperature changes the <em>flavor profile</em>, not just speed.</p>
      </EqCard>

      <EqCard title="5. Extraction Yield — Measuring Your Brew"
        tagline="The fraction of coffee that ended up in your cup"
        eqLabel="Extraction Yield"
        equation={<>EY = (C &middot; B) / D</>}
        analogy="Starting with 20g of coffee and extracting 4g of solubles = 20% yield. You can't get everything out — the last compounds taste harsh."
        infoTitle="Extraction Yield — How to Use It"
        infoContent={
          <>
            <p>
              EY = TDS × beverage_weight / coffee_dose. This simple formula works well for
              percolation brews (V60, Chemex, batch brew) where the water that passes through
              the grounds ends up in the cup.
            </p>
            <p>
              <strong>Gagné's important nuance:</strong> for immersion brews (French Press, AeroPress),
              a significant amount of water stays trapped in the spent grounds. The formula
              should account for this retained water, otherwise EY appears lower than it really is —
              leading you to think the brew was under-extracted when it wasn't.
              For percolation, the simple formula is fine.
            </p>
            <p>
              <strong>What the numbers mean:</strong>
            </p>
            <ul>
              <li><strong>Below 18%</strong>: under-extracted — mostly light acids extracted,
                heavier sweetness and balance compounds left behind. Tastes sour, sharp, grassy.</li>
              <li><strong>18–22%</strong>: ideal range — the balance of sweet, acidic, and
                bitter compounds produces a rounded flavor.</li>
              <li><strong>Above 22%</strong>: over-extracted — harsh, astringent, bitter compounds
                dissolved. The last solubles in coffee taste bad.</li>
            </ul>
            <p>
              You physically cannot extract 100% of coffee — roasting creates insoluble
              cell-wall structures. The practical maximum is around 28-30% EY
              even under ideal laboratory conditions.
            </p>
          </>
        }
      >
        <p><strong>C</strong> = TDS concentration, <strong>B</strong> = beverage weight, <strong>D</strong> = coffee dose.</p>
        <p className="mt-1">Ideal: <strong>18–22%</strong>. Below 18% = sour (under-extracted). Above 22% = bitter (over-extracted).</p>
      </EqCard>

      <EqCard title="6. Kinematic Viscosity — Temperature & Flow"
        tagline="Why hotter water flows faster through the bed"
        eqLabel="Kinematic Viscosity"
        equation={<>&nu; = &mu; / &rho;</>}
        analogy="Cold honey pours slowly; warm honey pours easily. Water does the same — less dramatically, but at the scale of tiny gaps between coffee grounds, it matters a lot."
        infoTitle="Kinematic Viscosity — Why Temperature Controls Flow"
        infoContent={
          <>
            <p>
              Kinematic viscosity ν = μ/ρ appears directly in Darcy's Law and the brew time equation.
              Water's viscosity drops significantly with temperature — this has a measurable effect
              on every brew.
            </p>
            <p>
              <strong>Numbers from Gagné:</strong>
            </p>
            <ul>
              <li>At 20°C: ν ≈ 1.00 mm²/s</li>
              <li>At 60°C: ν ≈ 0.47 mm²/s (2.1× faster flow than cold)</li>
              <li>At 80°C: ν ≈ 0.36 mm²/s</li>
              <li>At 95°C: ν ≈ 0.30 mm²/s (3.3× faster flow than cold)</li>
            </ul>
            <p>
              Since brew time scales linearly with ν (T ∝ ν·L/k), brewing at 80°C instead of 95°C
              increases brew time by about 20%. To maintain the same brew time,
              you'd need to grind coarser — which would also reduce extraction.
            </p>
            <p>
              This is the physical mechanism behind the common advice: <em>brew cooler → grind coarser</em>.
              The two adjustments compensate each other for brew time while also shifting
              extraction profile toward brighter, more acidic flavors.
            </p>
          </>
        }
      >
        <p>As temperature rises, viscosity drops significantly. <strong>Flow speeds up ~20% from 80&deg;C to 95&deg;C.</strong> Brew cooler? Grind coarser to compensate.</p>
      </EqCard>
    </section>
  );
}
