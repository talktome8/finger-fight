import type {
  ScoringRule,
} from '../types/round.js';
import type {
  TapEvent,
} from '../types/messages.js';

// ─── Scoring Engine ───────────────────────────────────────
// Pure functions, no framework dependency

export interface ScoringContext {
  rule: ScoringRule;
  taps: TapEvent[];
  zoneWidth: number;
  zoneHeight: number;
  roundDuration: number;
  currentScore: number;
  opponentIds: string[];
}

export interface ScoringResult {
  points: number;
  validTaps: number;
  invalidTaps: number;
  bonusTaps: number;
  stolenPoints: Record<string, number>;
  details: string;
}

export function calculateScore(ctx: ScoringContext): ScoringResult {
  switch (ctx.rule.type) {
    case 'per-tap':
      return scorePerTap(ctx, ctx.rule.pointsPerTap);
    case 'golden':
      return scoreGolden(ctx, ctx.rule);
    case 'reverse':
      return scoreReverse(ctx, ctx.rule);
    case 'precision':
      return scorePrecision(ctx, ctx.rule);
    case 'cooldown':
      return scoreCooldown(ctx, ctx.rule);
    case 'steal':
      return scoreSteal(ctx, ctx.rule);
    default:
      return emptyResult('Unknown scoring rule');
  }
}

function scorePerTap(ctx: ScoringContext, pointsPerTap: number): ScoringResult {
  const validTaps = ctx.taps.length;
  return {
    points: validTaps * pointsPerTap,
    validTaps,
    invalidTaps: 0,
    bonusTaps: 0,
    stolenPoints: {},
    details: `${validTaps} taps × ${pointsPerTap} pts`,
  };
}

function scoreGolden(
  ctx: ScoringContext,
  rule: Extract<ScoringRule, { type: 'golden' }>
): ScoringResult {
  // Golden taps are flagged by the UI/server via special coordinates
  // Taps with y < 0 are golden (convention for golden zone hits)
  const normalTaps = ctx.taps.filter((t) => t.y >= 0);
  const goldenTaps = ctx.taps.filter((t) => t.y < 0);

  const points =
    normalTaps.length * rule.basePoints +
    goldenTaps.length * rule.basePoints * rule.goldenMultiplier;

  return {
    points,
    validTaps: normalTaps.length,
    invalidTaps: 0,
    bonusTaps: goldenTaps.length,
    stolenPoints: {},
    details: `${normalTaps.length} normal + ${goldenTaps.length} golden`,
  };
}

function scoreReverse(
  ctx: ScoringContext,
  rule: Extract<ScoringRule, { type: 'reverse' }>
): ScoringResult {
  const penalty = ctx.taps.length * rule.penaltyPerTap;
  const points = Math.max(0, rule.maxScore - penalty);
  return {
    points,
    validTaps: 0,
    invalidTaps: ctx.taps.length,
    bonusTaps: 0,
    stolenPoints: {},
    details: `${rule.maxScore} - ${ctx.taps.length} × ${rule.penaltyPerTap} penalty`,
  };
}

function scorePrecision(
  ctx: ScoringContext,
  rule: Extract<ScoringRule, { type: 'precision' }>
): ScoringResult {
  const centerX = ctx.zoneWidth / 2;
  const centerY = ctx.zoneHeight / 2;

  let inside = 0;
  let outside = 0;

  for (const tap of ctx.taps) {
    const dx = tap.x - centerX;
    const dy = tap.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= rule.centerRadius) {
      inside++;
    } else {
      outside++;
    }
  }

  return {
    points: inside * rule.pointsInside + outside * rule.pointsOutside,
    validTaps: inside,
    invalidTaps: outside,
    bonusTaps: 0,
    stolenPoints: {},
    details: `${inside} bullseye, ${outside} missed`,
  };
}

function scoreCooldown(
  ctx: ScoringContext,
  rule: Extract<ScoringRule, { type: 'cooldown' }>
): ScoringResult {
  if (ctx.taps.length === 0) return emptyResult('No taps');

  let points = 0;
  let penalized = 0;
  const windowMs = 1000;

  for (let i = 0; i < ctx.taps.length; i++) {
    // Count taps in the preceding 1-second window
    const windowStart = ctx.taps[i].timestamp - windowMs;
    const tapsInWindow = ctx.taps.filter(
      (t, j) => j < i && t.timestamp >= windowStart
    ).length;

    if (tapsInWindow >= rule.cooldownThreshold) {
      points -= rule.cooldownPenalty;
      penalized++;
    } else {
      points += rule.pointsPerTap;
    }
  }

  return {
    points: Math.max(0, points),
    validTaps: ctx.taps.length - penalized,
    invalidTaps: penalized,
    bonusTaps: 0,
    stolenPoints: {},
    details: `${ctx.taps.length - penalized} valid, ${penalized} overheated`,
  };
}

function scoreSteal(
  ctx: ScoringContext,
  rule: Extract<ScoringRule, { type: 'steal' }>
): ScoringResult {
  const points = ctx.taps.length * rule.pointsPerTap;
  const totalSteal = ctx.taps.length * rule.stealAmount;

  // Distribute stolen points evenly among opponents
  const stolenPoints: Record<string, number> = {};
  if (ctx.opponentIds.length > 0) {
    const stealPerOpponent = Math.floor(totalSteal / ctx.opponentIds.length);
    for (const id of ctx.opponentIds) {
      stolenPoints[id] = stealPerOpponent;
    }
  }

  return {
    points,
    validTaps: ctx.taps.length,
    invalidTaps: 0,
    bonusTaps: 0,
    stolenPoints,
    details: `${ctx.taps.length} taps, stole ${totalSteal} pts`,
  };
}

function emptyResult(details: string): ScoringResult {
  return {
    points: 0,
    validTaps: 0,
    invalidTaps: 0,
    bonusTaps: 0,
    stolenPoints: {},
    details,
  };
}
