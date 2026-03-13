import { BrewProvider } from '@/components/BrewContext';
import BrewAnimation from '@/components/BrewAnimation';
import ControlsPanel from '@/components/ControlsPanel';
import ResultsSummary from '@/components/ResultsSummary';
import Charts from '@/components/Charts';
import EquationsSection from '@/components/EquationsSection';

export default function Home() {
  return (
    <>
      <header className="bg-gradient-to-br from-coffee-dark to-coffee-medium text-white py-6 md:py-10 px-6 text-center">
        <h1 className="font-display text-2xl md:text-4xl font-bold mb-2">The Physics of Filter Coffee</h1>
        <p className="text-base md:text-lg opacity-85 max-w-xl mx-auto font-light">
          An interactive simulation based on Jonathan Gagn&eacute;&apos;s book.
          Explore how grind size, temperature, and pouring affect your brew.
        </p>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-6">
        <BrewProvider>
          <BrewAnimation />

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-8">
            <ControlsPanel />
            <div className="flex flex-col gap-5">
              <ResultsSummary />
              <Charts />
            </div>
          </div>
        </BrewProvider>

        <EquationsSection />
      </main>

      <footer className="text-center py-6 text-coffee-light text-sm border-t border-border mt-6">
        Based on <em>The Physics of Filter Coffee</em> by Jonathan Gagn&eacute; (2020).
        Educational simulation — real brewing involves many more variables!
      </footer>
    </>
  );
}
