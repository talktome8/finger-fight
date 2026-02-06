import type { TapEvent } from '../types/messages';

// ─── CPU Opponent AI ──────────────────────────────────────
// Simulates realistic human tapping behavior

export type CPUDifficulty = 'easy' | 'normal' | 'aggressive';

export interface CPUProfile {
  baseTapRate: number;      // taps per second
  variance: number;          // random variation ±%
  fatigueRate: number;       // reduction per second after 3s
  reactionDelay: number;     // ms delay at round start
  burstChance: number;       // chance of brief speed burst
  burstMultiplier: number;   // burst speed multiplier
  missChance: number;        // chance of slightly off-target tap
}

export const CPU_PROFILES: Record<CPUDifficulty, CPUProfile> = {
  easy: {
    baseTapRate: 5,
    variance: 0.3,
    fatigueRate: 0.8,
    reactionDelay: 600,
    burstChance: 0.05,
    burstMultiplier: 1.3,
    missChance: 0.15,
  },
  normal: {
    baseTapRate: 8,
    variance: 0.2,
    fatigueRate: 0.5,
    reactionDelay: 350,
    burstChance: 0.1,
    burstMultiplier: 1.5,
    missChance: 0.08,
  },
  aggressive: {
    baseTapRate: 12,
    variance: 0.15,
    fatigueRate: 0.3,
    reactionDelay: 200,
    burstChance: 0.15,
    burstMultiplier: 1.8,
    missChance: 0.03,
  },
};

export function generateCPUTaps(
  difficulty: CPUDifficulty,
  roundDuration: number,
  zoneWidth: number,
  zoneHeight: number
): TapEvent[] {
  const profile = CPU_PROFILES[difficulty];
  const taps: TapEvent[] = [];

  let currentTime = profile.reactionDelay;
  const endTime = roundDuration * 1000;

  while (currentTime < endTime) {
    // Calculate current tap rate with fatigue
    const elapsed = currentTime / 1000;
    const fatigueFactor =
      elapsed > 3 ? 1 - profile.fatigueRate * ((elapsed - 3) / roundDuration) : 1;

    // Apply variance
    const variance = 1 + (Math.random() * 2 - 1) * profile.variance;
    let currentRate = profile.baseTapRate * fatigueFactor * variance;

    // Burst chance
    if (Math.random() < profile.burstChance) {
      currentRate *= profile.burstMultiplier;
    }

    currentRate = Math.max(currentRate, 1);

    const interval = 1000 / currentRate;
    currentTime += interval + Math.random() * (interval * 0.3);

    if (currentTime >= endTime) break;

    // Calculate position with some miss chance
    let x = zoneWidth / 2 + (Math.random() - 0.5) * zoneWidth * 0.4;
    let y = zoneHeight / 2 + (Math.random() - 0.5) * zoneHeight * 0.4;

    if (Math.random() < profile.missChance) {
      x += (Math.random() - 0.5) * zoneWidth * 0.6;
      y += (Math.random() - 0.5) * zoneHeight * 0.6;
    }

    x = Math.max(0, Math.min(zoneWidth, x));
    y = Math.max(0, Math.min(zoneHeight, y));

    taps.push({
      timestamp: Math.round(currentTime),
      x: Math.round(x),
      y: Math.round(y),
      fingerId: 0,
    });
  }

  return taps;
}

// Generate CPU taps for reverse round (tries to NOT tap)
export function generateCPUReverseRoundTaps(
  difficulty: CPUDifficulty,
  roundDuration: number,
  zoneWidth: number,
  zoneHeight: number
): TapEvent[] {
  const accidentalTaps: Record<CPUDifficulty, number> = {
    easy: 8,
    normal: 4,
    aggressive: 1,
  };

  const maxTaps = accidentalTaps[difficulty];
  const taps: TapEvent[] = [];

  for (let i = 0; i < maxTaps; i++) {
    const time = Math.random() * roundDuration * 1000;
    taps.push({
      timestamp: Math.round(time),
      x: Math.round(Math.random() * zoneWidth),
      y: Math.round(Math.random() * zoneHeight),
      fingerId: 0,
    });
  }

  return taps.sort((a, b) => a.timestamp - b.timestamp);
}
