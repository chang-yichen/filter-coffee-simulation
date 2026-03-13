'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { BrewParams, BrewConstants, AnimState, SimResult } from '@/lib/types';
import { buildBrewConstants, simulateFull, createAnimState, animStep } from '@/lib/simulation';
import { DEFAULT_PARAMS } from '@/lib/presets';

export interface BrewSimulation {
  params: BrewParams;
  setParams: (p: BrewParams) => void;
  updateParam: <K extends keyof BrewParams>(key: K, value: BrewParams[K]) => void;
  result: SimResult;
  constants: BrewConstants;
  // Animation
  animState: AnimState;
  isRunning: boolean;
  speed: number;
  setSpeed: (s: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export function useBrewSimulation(): BrewSimulation {
  const [params, setParams] = useState<BrewParams>(DEFAULT_PARAMS);
  const [speed, setSpeed] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [, forceRender] = useState(0);

  const constants = useMemo(() => buildBrewConstants(params), [params]);
  const result = useMemo(() => simulateFull(params), [params]);

  const animStateRef = useRef<AnimState>(createAnimState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const isRunningRef = useRef(false);
  const speedRef = useRef(speed);
  const paramsRef = useRef(params);
  const constantsRef = useRef(constants);

  // Keep refs in sync
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { paramsRef.current = params; constantsRef.current = constants; }, [params, constants]);

  const animLoop = useCallback((now: number) => {
    if (!isRunningRef.current) return;

    const realDt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;
    const simDt = realDt * speedRef.current;

    const stepSize = 0.1;
    let remaining = simDt;
    const a = animStateRef.current;
    const s = constantsRef.current;
    const p = paramsRef.current;

    while (remaining > 0 && !a.done) {
      const step = Math.min(stepSize, remaining);
      animStep(a, s, p, step);
      remaining -= step;
    }

    forceRender(n => n + 1);

    if (a.done) {
      isRunningRef.current = false;
      setIsRunning(false);
      return;
    }

    rafRef.current = requestAnimationFrame(animLoop);
  }, []);

  const play = useCallback(() => {
    if (animStateRef.current.done) {
      animStateRef.current = createAnimState();
    }
    isRunningRef.current = true;
    setIsRunning(true);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animLoop);
  }, [animLoop]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    pause();
    animStateRef.current = createAnimState();
    forceRender(n => n + 1);
  }, [pause]);

  // Reset animation when params change
  useEffect(() => {
    if (!isRunningRef.current) {
      animStateRef.current = createAnimState();
      forceRender(n => n + 1);
    }
  }, [params]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const updateParam = useCallback(<K extends keyof BrewParams>(key: K, value: BrewParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    params, setParams, updateParam,
    result, constants,
    animState: animStateRef.current,
    isRunning, speed, setSpeed,
    play, pause, reset,
  };
}
