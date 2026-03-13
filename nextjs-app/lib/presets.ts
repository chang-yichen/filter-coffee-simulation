import type { BrewParams } from './types';

// Hoffmann V60 02 — 30g / 500g water, 3-pour schedule
export const DEFAULT_PARAMS: BrewParams = {
  dose: 30, grind: 730, waterTotal: 500, temp: 100,
  pourRate: 8, numPours: 3, dripperType: 'cone', diameter: 116,
  pourPattern: 'circular', avoidPaper: true, bloomWetting: 'even', swirl: true,
  pourSchedule: [
    { startTime:  0, amount:  90 },  // bloom: 90 g at 0 s
    { startTime: 45, amount: 210 },  // main:  210 g at 0:45
    { startTime: 75, amount: 200 },  // final: 200 g at 1:15
  ],
};

export const PRESETS: Record<string, { label: string; params: BrewParams }> = {
  hoffmann30: {
    label: 'Hoffmann V60 02 – 30g',
    params: {
      dose: 30, grind: 730, waterTotal: 500, temp: 100,
      pourRate: 8, numPours: 3, dripperType: 'cone', diameter: 116,
      pourPattern: 'circular', avoidPaper: true, bloomWetting: 'even', swirl: true,
      pourSchedule: [
        { startTime:  0, amount:  90 },  // 90 g  → total  90 g
        { startTime: 45, amount: 210 },  // 210 g → total 300 g
        { startTime: 75, amount: 200 },  // 200 g → total 500 g
      ],
    },
  },
  hoffmann15: {
    label: 'Hoffmann V60 02 – 15g',
    params: {
      dose: 15, grind: 600, waterTotal: 250, temp: 93,
      pourRate: 4, numPours: 5, dripperType: 'cone', diameter: 116,
      pourPattern: 'circular', avoidPaper: true, bloomWetting: 'even', swirl: true,
      pourSchedule: [
        { startTime:   0, amount: 50 },  // 50 g → total  50 g
        { startTime:  45, amount: 50 },  // 50 g → total 100 g
        { startTime:  70, amount: 50 },  // 50 g → total 150 g  (1:10)
        { startTime:  90, amount: 50 },  // 50 g → total 200 g  (1:30)
        { startTime: 110, amount: 50 },  // 50 g → total 250 g  (1:50)
      ],
    },
  },
};
