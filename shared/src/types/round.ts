// ─── Round Types ──────────────────────────────────────────
export type RoundType =
  | 'classic'
  | 'golden'
  | 'reverse'
  | 'precision'
  | 'cooldown'
  | 'steal';

export interface RoundConfig {
  type: RoundType;
  duration: number;
  title: string;
  description: string;
  icon: string;
  isSpotlight: boolean;
  spotlightPlayerId?: string;
  isFinalTwist: boolean;
  modifiers: RoundModifiers;
}

export interface RoundModifiers {
  scoringRule: ScoringRule;
  inputRule: InputRule;
  durationPolicy: DurationPolicy;
  uiOverlay?: UIOverlay;
}

// ─── Scoring ──────────────────────────────────────────────
export type ScoringRule =
  | { type: 'per-tap'; pointsPerTap: number }
  | { type: 'golden'; basePoints: number; goldenMultiplier: number; goldenInterval: number }
  | { type: 'reverse'; maxScore: number; penaltyPerTap: number }
  | { type: 'precision'; centerRadius: number; pointsInside: number; pointsOutside: number }
  | { type: 'cooldown'; pointsPerTap: number; cooldownThreshold: number; cooldownPenalty: number }
  | { type: 'steal'; pointsPerTap: number; stealAmount: number };

// ─── Input ────────────────────────────────────────────────
export type InputRule =
  | { type: 'standard'; maxTapsPerSecond: number }
  | { type: 'multi-touch'; maxFingers: number; maxTapsPerSecond: number }
  | { type: 'precision'; targetZone: { x: number; y: number; radius: number } };

// ─── Duration ─────────────────────────────────────────────
export type DurationPolicy =
  | { type: 'fixed'; seconds: number }
  | { type: 'variable'; minSeconds: number; maxSeconds: number };

// ─── UI Overlay ───────────────────────────────────────────
export interface UIOverlay {
  type: string;
  data?: Record<string, unknown>;
}

// ─── Round Definitions ────────────────────────────────────
export const ROUND_DEFINITIONS: Record<RoundType, Omit<RoundConfig, 'isSpotlight' | 'spotlightPlayerId' | 'isFinalTwist' | 'duration'>> = {
  classic: {
    type: 'classic',
    title: 'TAP FRENZY',
    description: 'Every tap counts! Tap as fast as you can!',
    icon: '👆',
    modifiers: {
      scoringRule: { type: 'per-tap', pointsPerTap: 1 },
      inputRule: { type: 'standard', maxTapsPerSecond: 20 },
      durationPolicy: { type: 'fixed', seconds: 6 },
    },
  },
  golden: {
    type: 'golden',
    title: 'GOLDEN RUSH',
    description: 'Catch the golden icons for bonus points!',
    icon: '⭐',
    modifiers: {
      scoringRule: { type: 'golden', basePoints: 1, goldenMultiplier: 5, goldenInterval: 1500 },
      inputRule: { type: 'standard', maxTapsPerSecond: 20 },
      durationPolicy: { type: 'fixed', seconds: 7 },
      uiOverlay: { type: 'golden-targets' },
    },
  },
  reverse: {
    type: 'reverse',
    title: 'HOLD BACK',
    description: 'Fewest taps wins! Control yourself!',
    icon: '🔄',
    modifiers: {
      scoringRule: { type: 'reverse', maxScore: 100, penaltyPerTap: 5 },
      inputRule: { type: 'standard', maxTapsPerSecond: 20 },
      durationPolicy: { type: 'fixed', seconds: 5 },
    },
  },
  precision: {
    type: 'precision',
    title: 'BULLSEYE',
    description: 'Only taps near the center count!',
    icon: '🎯',
    modifiers: {
      scoringRule: { type: 'precision', centerRadius: 60, pointsInside: 3, pointsOutside: 0 },
      inputRule: { type: 'precision', targetZone: { x: 0.5, y: 0.5, radius: 0.15 } },
      durationPolicy: { type: 'fixed', seconds: 6 },
      uiOverlay: { type: 'precision-target' },
    },
  },
  cooldown: {
    type: 'cooldown',
    title: 'KEEP COOL',
    description: 'Too fast and you lose points! Find the rhythm!',
    icon: '❄️',
    modifiers: {
      scoringRule: { type: 'cooldown', pointsPerTap: 2, cooldownThreshold: 8, cooldownPenalty: 3 },
      inputRule: { type: 'standard', maxTapsPerSecond: 20 },
      durationPolicy: { type: 'fixed', seconds: 7 },
      uiOverlay: { type: 'cooldown-meter' },
    },
  },
  steal: {
    type: 'steal',
    title: 'STEAL IT',
    description: 'Your taps steal points from opponents!',
    icon: '💰',
    modifiers: {
      scoringRule: { type: 'steal', pointsPerTap: 1, stealAmount: 1 },
      inputRule: { type: 'multi-touch', maxFingers: 3, maxTapsPerSecond: 20 },
      durationPolicy: { type: 'fixed', seconds: 6 },
    },
  },
};
