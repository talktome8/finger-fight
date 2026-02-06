import type { Player, PlayerScore } from './player.js';
import type { RoundType, RoundConfig } from './round.js';

// ─── Room ─────────────────────────────────────────────────
export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  state: RoomState;
  settings: MatchSettings;
  createdAt: number;
  expiresAt: number;
}

export type RoomState =
  | 'waiting'
  | 'starting'
  | 'playing'
  | 'round-results'
  | 'finished';

// ─── Match ────────────────────────────────────────────────
export interface MatchSettings {
  totalRounds: number;
  defaultRoundDuration: number;
  roundTypes: RoundType[];
  allowMultiTouch: boolean;
  maxPlayers: number;
}

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  totalRounds: 7,
  defaultRoundDuration: 6,
  roundTypes: ['classic', 'golden', 'reverse', 'precision', 'cooldown', 'steal'],
  allowMultiTouch: true,
  maxPlayers: 4,
};

export interface MatchState {
  matchId: string;
  currentRound: number;
  totalRounds: number;
  roundConfig: RoundConfig;
  scores: PlayerScore[];
  phase: MatchPhase;
  roundStartTime: number;
  roundEndTime: number;
}

export type MatchPhase =
  | 'idle'
  | 'countdown'
  | 'round-intro'
  | 'playing'
  | 'round-results'
  | 'final-podium';
