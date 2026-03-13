'use client';

import { useState } from 'react';
import { useBrew } from './BrewContext';
import InfoModal from './InfoModal';

function TechniqueCheckbox({
  label,
  checked,
  onChange,
  onInfo,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onInfo: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-[#6F4E37] cursor-pointer flex-shrink-0"
      />
      <span className="text-sm text-coffee-dark flex-1">{label}</span>
      <button
        type="button"
        onClick={e => { e.preventDefault(); onInfo(); }}
        title="Learn more from the physics book"
        className="flex-shrink-0 w-5 h-5 rounded-full border border-coffee-light text-coffee-light
          hover:border-coffee-medium hover:text-coffee-medium text-xs font-bold leading-none
          flex items-center justify-center transition-colors"
      >
        i
      </button>
    </label>
  );
}

export default function TechniqueSection() {
  const { params, updateParam } = useBrew();
  const [modal, setModal] = useState<null | 'pattern' | 'paper' | 'bloom' | 'swirl'>(null);

  return (
    <>
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm mb-6">
        <h2 className="font-display text-xl mb-1 text-coffee-dark">Pouring Technique</h2>
        <p className="text-xs text-coffee-light mb-4">
          How you pour matters — each choice affects channeling, extraction uniformity, and EY
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TechniqueCheckbox
            label="Circular pour (not centre)"
            checked={params.pourPattern === 'circular'}
            onChange={v => updateParam('pourPattern', v ? 'circular' : 'center')}
            onInfo={() => setModal('pattern')}
          />
          <TechniqueCheckbox
            label="Avoid pouring on filter paper"
            checked={params.avoidPaper}
            onChange={v => updateParam('avoidPaper', v)}
            onInfo={() => setModal('paper')}
          />
          <TechniqueCheckbox
            label="Even bloom wetting"
            checked={params.bloomWetting === 'even'}
            onChange={v => updateParam('bloomWetting', v ? 'even' : 'center')}
            onInfo={() => setModal('bloom')}
          />
          <TechniqueCheckbox
            label="Swirl after final pour (Rao Spin)"
            checked={params.swirl}
            onChange={v => updateParam('swirl', v)}
            onInfo={() => setModal('swirl')}
          />
        </div>

        <div className="mt-3 text-[0.65rem] text-coffee-light text-right">
          Channeling: <span className="font-semibold text-coffee-medium">
            {Math.round(
              (params.pourPattern === 'circular' ? 0 : 7) +
              (params.avoidPaper ? 0 : 7) +
              (params.swirl ? -3 : 0) + 3
            )}% bypass
          </span> · Bloom efficiency: <span className="font-semibold text-coffee-medium">
            {params.bloomWetting === 'even' ? '100%' : '50%'}
          </span>
        </div>
      </div>

      {modal === 'pattern' && (
        <InfoModal title="Pour Pattern — Centre vs Circular" onClose={() => setModal(null)}>
          <p>
            Gagné explains that where you direct water during a pour determines how evenly
            the coffee bed is saturated. Pouring in the centre concentrates water in one
            zone, leaving the outer grounds under-saturated. These dry patches contribute
            fewer solubles and create preferential flow paths — <strong>channeling</strong> —
            where water finds the path of least resistance rather than passing uniformly
            through all the grounds.
          </p>
          <p>
            A <strong>circular pour</strong> (starting in the centre and spiralling outward,
            or starting from the outside moving inward) wets the entire bed evenly. All
            grounds swell at the same rate, sealing gaps and forcing water through a
            uniform resistance. The result is more consistent extraction across the
            full bed volume.
          </p>
          <p>
            <strong>Simulated effect:</strong> circular vs centre pour changes channeling
            bypass from ~3% to ~10%+, reducing extraction yield by 1–3 percentage points.
          </p>
        </InfoModal>
      )}

      {modal === 'paper' && (
        <InfoModal title="Avoiding the Filter Paper" onClose={() => setModal(null)}>
          <p>
            The filter paper in a V60 is held against the cone walls. When water is poured
            directly onto the paper rather than the coffee bed, Gagné notes that it tends
            to run down the paper-to-cone interface and reach the cup without ever passing
            through the grounds. This is a form of <strong>bypass channeling</strong> —
            the water contributes volume to the cup but carries almost no extracted
            coffee compounds.
          </p>
          <p>
            The practical consequence is that the effective brew ratio is diluted:
            you added the intended amount of water, but a fraction of it bypassed
            the coffee entirely. The cup will taste weaker and more watery than
            the recipe intended, even if grind and temperature are perfect.
          </p>
          <p>
            <strong>Simulated effect:</strong> pouring on the paper adds ~7% bypass flow,
            lowering TDS noticeably and slightly reducing extraction yield.
          </p>
        </InfoModal>
      )}

      {modal === 'bloom' && (
        <InfoModal title="Bloom Wetting — Even vs Centre-Only" onClose={() => setModal(null)}>
          <p>
            The bloom (pre-infusion) pour serves a specific physical purpose: allowing
            CO₂ trapped inside freshly-roasted coffee grounds to degas before the main
            extraction begins. CO₂ bubbles form a hydrophobic barrier around each
            particle, actively repelling water. If a ground hasn't been wetted during
            the bloom, it enters the main pours still full of CO₂ and resists extraction.
          </p>
          <p>
            Gagné shows that <strong>even wetting</strong> during the bloom — ensuring
            every gram of coffee is moistened — is essential for uniform degassing.
            Centre-only wetting leaves the outer ring of grounds dry. When the main
            pour begins, those grounds suddenly receive a large volume of water at once,
            creating a burst of CO₂ turbulence that disrupts the bed and
            creates uneven flow paths.
          </p>
          <p>
            <strong>Simulated effect:</strong> centre-only bloom wetting reduces effective
            surface area during the bloom pour by ~50%, as half the grounds aren't yet
            contributing to extraction. This lowers early extraction and final EY by
            2–4 percentage points.
          </p>
        </InfoModal>
      )}

      {modal === 'swirl' && (
        <InfoModal title="Swirl After Final Pour — The Rao Spin" onClose={() => setModal(null)}>
          <p>
            After the final pour, the coffee bed in a V60 is rarely flat. The turbulence
            from pouring creates peaks and valleys in the bed surface. Gagné explains
            that an uneven bed means water has different path lengths through different
            parts of the cone: over a peak, water drains quickly through a shallow
            bed; over a valley, it must push through a deeper bed.
          </p>
          <p>
            The <strong>Rao Spin</strong> (named after barista Scott Rao, discussed in
            Gagné's treatment of bed uniformity) involves giving the dripper a gentle
            circular swirl during drawdown. Centrifugal force redistributes the grounds
            into a flat, level bed. With uniform bed depth, every path through the bed
            has the same resistance — water can no longer find "fast lanes" through
            shallow spots. Extraction becomes more even across the whole dose.
          </p>
          <p>
            <strong>Simulated effect:</strong> swirling reduces micro-channeling by 3–4%,
            improving extraction yield by about 0.5–1.5 percentage points — a modest but
            consistently repeatable gain that professional baristas rely on.
          </p>
        </InfoModal>
      )}
    </>
  );
}
