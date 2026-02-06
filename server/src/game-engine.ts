import type { GameRoom } from './room-manager.js';
import type {
  ServerMessage,
  PlayerScore,
  TapPayload,
  RoundConfig,
  MatchState,
  RoundType,
} from '@finger-fight/shared';
import {
  calculateScore,
  validateTaps,
  GameTimer,
  ROUND_DEFINITIONS,
} from '@finger-fight/shared';

type BroadcastFn = (msg: ServerMessage, excludeId?: string) => void;

export class GameEngine {
  private room: GameRoom;
  private broadcast: BroadcastFn;
  private rounds: RoundConfig[] = [];
  private currentRound = 0;
  private scores: Map<string, number[]> = new Map();
  private roundTaps: Map<string, TapPayload[]> = new Map();
  private timer = new GameTimer();
  private stopped = false;

  constructor(room: GameRoom, broadcast: BroadcastFn) {
    this.room = room;
    this.broadcast = broadcast;
  }

  startMatch(): void {
    const playerIds = [...this.room.players.keys()];
    this.rounds = this.generateRounds(playerIds);
    this.currentRound = 0;

    // Initialize scores
    for (const id of playerIds) {
      this.scores.set(id, []);
    }

    const matchState: MatchState = {
      matchId: this.room.id,
      currentRound: 0,
      totalRounds: this.rounds.length,
      roundConfig: this.rounds[0],
      scores: this.buildScores(),
      phase: 'countdown',
      roundStartTime: 0,
      roundEndTime: 0,
    };

    this.broadcast({ type: 'match-starting', matchState });

    // Start first round after brief delay
    setTimeout(() => {
      if (!this.stopped) this.startRound();
    }, 2000);
  }

  private startRound(): void {
    if (this.stopped) return;
    if (this.currentRound >= this.rounds.length) {
      this.endMatch();
      return;
    }

    const config = this.rounds[this.currentRound];
    this.roundTaps.clear();

    // Round intro
    this.broadcast({
      type: 'round-intro',
      round: this.currentRound,
      config,
    });

    // After intro, start playing
    setTimeout(() => {
      if (this.stopped) return;

      const startTime = Date.now();
      const endTime = startTime + config.duration * 1000;

      this.broadcast({
        type: 'round-start',
        round: this.currentRound,
        startTime,
        endTime,
      });

      // Start round timer
      this.timer.start(config.duration, {
        onTick: (remaining) => {
          this.broadcast({
            type: 'round-tick',
            timeRemaining: Math.round(remaining * 10) / 10,
          });
        },
        onComplete: () => {
          if (!this.stopped) this.endRound();
        },
      });

      // Golden targets for golden rounds
      if (config.type === 'golden') {
        this.scheduleGoldenTargets(config.duration);
      }
    }, 2500); // 2.5s intro
  }

  receiveTapData(playerId: string, payload: TapPayload): void {
    if (!this.roundTaps.has(playerId)) {
      this.roundTaps.set(playerId, []);
    }
    this.roundTaps.get(playerId)!.push(payload);
  }

  private endRound(): void {
    if (this.stopped) return;
    this.timer.stop();

    const config = this.rounds[this.currentRound];
    const playerIds = [...this.room.players.keys()];

    // Calculate scores for each player
    for (const playerId of playerIds) {
      const tapPayloads = this.roundTaps.get(playerId) || [];
      const allTaps = tapPayloads.flatMap((p) => p.taps);

      // Validate taps
      const { validTaps } = validateTaps(allTaps);

      const result = calculateScore({
        rule: config.modifiers.scoringRule,
        taps: validTaps,
        zoneWidth: 400,
        zoneHeight: 600,
        roundDuration: config.duration,
        currentScore: this.getTotalScore(playerId),
        opponentIds: playerIds.filter((id) => id !== playerId),
      });

      // Apply score
      const playerScores = this.scores.get(playerId) || [];
      playerScores.push(result.points);
      this.scores.set(playerId, playerScores);

      // Apply steals
      if (result.stolenPoints) {
        for (const [targetId, stolen] of Object.entries(result.stolenPoints)) {
          const targetScores = this.scores.get(targetId);
          if (targetScores && targetScores.length > 0) {
            const lastIdx = targetScores.length - 1;
            targetScores[lastIdx] = Math.max(0, targetScores[lastIdx] - stolen);
          }
        }
      }
    }

    // Broadcast round results
    this.broadcast({
      type: 'round-end',
      round: this.currentRound,
      scores: this.buildScores(),
    });

    this.currentRound++;

    // Next round after delay
    setTimeout(() => {
      if (!this.stopped) this.startRound();
    }, 3500);
  }

  private endMatch(): void {
    const scores = this.buildScores();
    const winner = scores.reduce((best, s) =>
      s.totalScore > best.totalScore ? s : best
    );

    const winnerPlayer = this.room.players.get(winner.playerId)?.player;

    if (winnerPlayer) {
      this.broadcast({
        type: 'match-end',
        finalScores: scores,
        winner: winnerPlayer,
      });
    }

    this.room.state = 'finished';
  }

  private buildScores(): PlayerScore[] {
    const result: PlayerScore[] = [];
    for (const [playerId, roundScores] of this.scores) {
      result.push({
        playerId,
        roundScores,
        totalScore: roundScores.reduce((a, b) => a + b, 0),
      });
    }
    return result.sort((a, b) => b.totalScore - a.totalScore);
  }

  private getTotalScore(playerId: string): number {
    const scores = this.scores.get(playerId) || [];
    return scores.reduce((a, b) => a + b, 0);
  }

  private scheduleGoldenTargets(duration: number): void {
    const interval = 1500;
    const count = Math.floor((duration * 1000) / interval);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.stopped) return;
        this.broadcast({
          type: 'golden-target',
          position: {
            x: 0.1 + Math.random() * 0.8,
            y: 0.1 + Math.random() * 0.8,
          },
          expiresAt: Date.now() + 800,
        });
      }, (i + 1) * interval);
    }
  }

  private generateRounds(playerIds: string[]): RoundConfig[] {
    const roundDefs = this.getRoundDefinitions();
    const types = this.room.settings.roundTypes;
    const total = this.room.settings.totalRounds;
    const defaultDur = this.room.settings.defaultRoundDuration;
    const rounds: RoundConfig[] = [];

    for (let i = 0; i < total; i++) {
      const isLast = i === total - 1;
      const isSpotlight = !isLast && i % 3 === 2 && playerIds.length > 1;

      let type: RoundType;
      if (i === 0) {
        type = 'classic';
      } else if (isLast) {
        const exciting: RoundType[] = ['steal', 'golden'];
        type = this.pickRandom(exciting.filter((t) => types.includes(t))) || 'classic';
      } else {
        const prev = rounds[i - 1]?.type;
        const avail = types.filter((t) => t !== prev);
        type = this.pickRandom(avail.length > 0 ? avail : types) || 'classic';
      }

      const def = roundDefs[type];
      const durationPolicy = def.modifiers.durationPolicy;
      const duration =
        durationPolicy.type === 'fixed'
          ? durationPolicy.seconds
          : defaultDur;

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

    return rounds;
  }

  private getRoundDefinitions() {
    return ROUND_DEFINITIONS as Record<RoundType, any>;
  }

  private pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  stop(): void {
    this.stopped = true;
    this.timer.stop();
  }
}
