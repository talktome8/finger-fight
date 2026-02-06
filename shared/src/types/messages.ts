import type { Player, PlayerScore } from './player';
import type { RoundConfig, RoundType } from './round';
import type { MatchSettings, MatchState } from './game';

// ─── Client → Server Messages ─────────────────────────────
export type ClientMessage =
  | { type: 'create-room'; nickname: string }
  | { type: 'join-room'; roomCode: string; nickname: string }
  | { type: 'leave-room' }
  | { type: 'start-match' }
  | { type: 'tap-data'; payload: TapPayload }
  | { type: 'ready' }
  | { type: 'ping'; timestamp: number }
  | { type: 'update-settings'; settings: Partial<MatchSettings> };

// ─── Server → Client Messages ─────────────────────────────
export type ServerMessage =
  | { type: 'room-created'; roomCode: string; playerId: string; player: Player }
  | { type: 'room-joined'; roomCode: string; playerId: string; player: Player; players: Player[] }
  | { type: 'player-joined'; player: Player }
  | { type: 'player-left'; playerId: string }
  | { type: 'room-closed' }
  | { type: 'match-starting'; matchState: MatchState }
  | { type: 'round-intro'; round: number; config: RoundConfig }
  | { type: 'round-start'; round: number; startTime: number; endTime: number }
  | { type: 'round-tick'; timeRemaining: number }
  | { type: 'round-end'; round: number; scores: PlayerScore[] }
  | { type: 'golden-target'; position: { x: number; y: number }; expiresAt: number }
  | { type: 'score-update'; scores: PlayerScore[] }
  | { type: 'match-end'; finalScores: PlayerScore[]; winner: Player }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong'; timestamp: number; serverTime: number }
  | { type: 'settings-updated'; settings: MatchSettings };

// ─── Tap Payload ──────────────────────────────────────────
export interface TapPayload {
  taps: TapEvent[];
  windowStart: number;
  windowEnd: number;
}

export interface TapEvent {
  timestamp: number;
  x: number;
  y: number;
  fingerId: number;
}

// ─── Error Codes ──────────────────────────────────────────
export const ERROR_CODES = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_IN_GAME: 'ROOM_IN_GAME',
  NOT_HOST: 'NOT_HOST',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  RATE_LIMITED: 'RATE_LIMITED',
  NICKNAME_TAKEN: 'NICKNAME_TAKEN',
  INVALID_NICKNAME: 'INVALID_NICKNAME',
} as const;
