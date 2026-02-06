import type {
  RoundConfig,
  RoundType,
} from '../types/round.js';
import type { MatchSettings } from '../types/game.js';
import { ROUND_DEFINITIONS } from '../types/round.js';

// ─── Match Generator ──────────────────────────────────────
// Generates a sequence of rounds for a match

export interface MatchPlan {
  rounds: RoundConfig[];
  totalRounds: number;
}

export function generateMatchPlan(
  settings: MatchSettings,
  playerIds: string[]
): MatchPlan {
  const { totalRounds, defaultRoundDuration, roundTypes } = settings;
  const rounds: RoundConfig[] = [];

  // Build pool of available round types
  const pool = [...roundTypes];

  for (let i = 0; i < totalRounds; i++) {
    const isLast = i === totalRounds - 1;
    const isSpotlight = !isLast && i % 3 === 2 && playerIds.length > 1;

    // Pick round type
    let roundType: RoundType;
    if (isLast) {
      // Final round: pick something exciting
      const exciting: RoundType[] = ['steal', 'golden', 'cooldown'];
      roundType = pickRandom(exciting.filter((t) => pool.includes(t))) || 'classic';
    } else if (i === 0) {
      // First round always classic to introduce
      roundType = 'classic';
    } else {
      // Avoid consecutive same types
      const prevType = rounds[i - 1]?.type;
      const available = pool.filter((t) => t !== prevType);
      roundType = pickRandom(available.length > 0 ? available : pool) || 'classic';
    }

    const def = getRoundDefinition(roundType);
    const duration = getDuration(def, defaultRoundDuration);

    rounds.push({
      ...def,
      duration,
      isSpotlight,
      spotlightPlayerId: isSpotlight
        ? playerIds[i % playerIds.length]
        : undefined,
      isFinalTwist: isLast,
    });
  }

  return { rounds, totalRounds };
}

function getDuration(
  def: ReturnType<typeof getRoundDefinition>,
  defaultDuration: number
): number {
  const policy = def.modifiers.durationPolicy;
  if (policy.type === 'fixed') return policy.seconds;
  if (policy.type === 'variable') {
    return (
      policy.minSeconds +
      Math.random() * (policy.maxSeconds - policy.minSeconds)
    );
  }
  return defaultDuration;
}

function getRoundDefinition(type: RoundType) {
  return ROUND_DEFINITIONS[type];
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}
