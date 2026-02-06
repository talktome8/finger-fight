import type { Player, PlayerColor, PLAYER_COLORS, PlayerScore } from '@finger-fight/shared';
import type {
  MatchSettings,
  MatchState,
  DEFAULT_MATCH_SETTINGS,
} from '@finger-fight/shared';
import type { RoundConfig } from '@finger-fight/shared';
import type { TapPayload } from '@finger-fight/shared';
import { v4 as uuid } from 'uuid';

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: Map<string, RoomPlayer>;
  state: RoomState;
  settings: MatchSettings;
  match: MatchData | null;
  createdAt: number;
  expiresAt: number;
}

export interface RoomPlayer {
  player: Player;
  ws: unknown; // WebSocket reference
  tapBuffer: TapPayload[];
  ready: boolean;
}

export type RoomState = 'waiting' | 'starting' | 'playing' | 'round-results' | 'finished';

export interface MatchData {
  matchId: string;
  rounds: RoundConfig[];
  currentRound: number;
  scores: Map<string, number[]>; // playerId -> score per round
  roundStartTime: number;
  roundEndTime: number;
  tapData: Map<string, TapPayload[]>; // playerId -> taps for current round
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private codeToRoomId: Map<string, string> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  createRoom(hostPlayer: Omit<Player, 'color' | 'isHost'>, ws: unknown): GameRoom {
    const id = uuid();
    const code = this.generateCode();
    const colors: PlayerColor[] = ['#FF4B4B', '#4BABFF', '#FFD93D', '#6BCB77'];

    const player: Player = {
      ...hostPlayer,
      color: colors[0],
      isHost: true,
    };

    const room: GameRoom = {
      id,
      code,
      hostId: player.id,
      players: new Map(),
      state: 'waiting',
      settings: {
        totalRounds: 7,
        defaultRoundDuration: 6,
        roundTypes: ['classic', 'golden', 'reverse', 'precision', 'cooldown', 'steal'],
        allowMultiTouch: true,
        maxPlayers: 4,
      },
      match: null,
      createdAt: Date.now(),
      expiresAt: Date.now() + ROOM_EXPIRY_MS,
    };

    room.players.set(player.id, {
      player,
      ws,
      tapBuffer: [],
      ready: false,
    });

    this.rooms.set(id, room);
    this.codeToRoomId.set(code, id);
    this.playerToRoom.set(player.id, id);

    return room;
  }

  joinRoom(
    code: string,
    joiningPlayer: Omit<Player, 'color' | 'isHost'>,
    ws: unknown
  ): { room: GameRoom; player: Player } | { error: string } {
    const roomId = this.codeToRoomId.get(code.toUpperCase());
    if (!roomId) return { error: 'ROOM_NOT_FOUND' };

    const room = this.rooms.get(roomId);
    if (!room) return { error: 'ROOM_NOT_FOUND' };

    if (room.state !== 'waiting') return { error: 'ROOM_IN_GAME' };
    if (room.players.size >= room.settings.maxPlayers) return { error: 'ROOM_FULL' };

    // Check nickname uniqueness
    for (const [, rp] of room.players) {
      if (rp.player.nickname.toLowerCase() === joiningPlayer.nickname.toLowerCase()) {
        return { error: 'NICKNAME_TAKEN' };
      }
    }

    const colors: PlayerColor[] = ['#FF4B4B', '#4BABFF', '#FFD93D', '#6BCB77'];
    const usedColors = new Set([...room.players.values()].map((p) => p.player.color));
    const availableColor = colors.find((c) => !usedColors.has(c)) || colors[0];

    const player: Player = {
      ...joiningPlayer,
      color: availableColor,
      isHost: false,
    };

    room.players.set(player.id, {
      player,
      ws,
      tapBuffer: [],
      ready: false,
    });

    this.playerToRoom.set(player.id, room.id);

    return { room, player };
  }

  removePlayer(playerId: string): { room: GameRoom; wasHost: boolean } | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const wasHost = room.hostId === playerId;
    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);

    // Transfer host
    if (wasHost && room.players.size > 0) {
      const newHost = room.players.values().next().value!;
      newHost.player.isHost = true;
      room.hostId = newHost.player.id;
    }

    // Clean up empty rooms
    if (room.players.size === 0) {
      this.destroyRoom(room.id);
    }

    return { room, wasHost };
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): GameRoom | undefined {
    const roomId = this.codeToRoomId.get(code.toUpperCase());
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getRoomByPlayer(playerId: string): GameRoom | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [playerId] of room.players) {
      this.playerToRoom.delete(playerId);
    }
    this.codeToRoomId.delete(room.code);
    this.rooms.delete(roomId);
  }

  // Clean up expired rooms
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, room] of this.rooms) {
      if (now > room.expiresAt) {
        this.destroyRoom(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  private generateCode(): string {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
      }
    } while (this.codeToRoomId.has(code));
    return code;
  }

  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.playerToRoom.size,
    };
  }
}
