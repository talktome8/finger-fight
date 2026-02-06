// ─── Player ───────────────────────────────────────────────
export interface Player {
  id: string;
  nickname: string;
  color: PlayerColor;
  isHost: boolean;
  isCPU: boolean;
  deviceId: string;
  connected: boolean;
}

export type PlayerColor = '#FF4B4B' | '#4BABFF' | '#FFD93D' | '#6BCB77';

export const PLAYER_COLORS: PlayerColor[] = [
  '#FF4B4B',
  '#4BABFF',
  '#FFD93D',
  '#6BCB77',
];

export const PLAYER_COLOR_NAMES: Record<PlayerColor, string> = {
  '#FF4B4B': 'Red',
  '#4BABFF': 'Blue',
  '#FFD93D': 'Yellow',
  '#6BCB77': 'Green',
};

export interface PlayerScore {
  playerId: string;
  roundScores: number[];
  totalScore: number;
}
