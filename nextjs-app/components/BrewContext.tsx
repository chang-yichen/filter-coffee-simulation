'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useBrewSimulation, type BrewSimulation } from '@/hooks/useBrewSimulation';

const BrewContext = createContext<BrewSimulation | null>(null);

export function BrewProvider({ children }: { children: ReactNode }) {
  const sim = useBrewSimulation();
  return <BrewContext.Provider value={sim}>{children}</BrewContext.Provider>;
}

export function useBrew(): BrewSimulation {
  const ctx = useContext(BrewContext);
  if (!ctx) throw new Error('useBrew must be used inside BrewProvider');
  return ctx;
}
