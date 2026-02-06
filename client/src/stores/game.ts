import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Player,
  PlayerScore,
  RoundConfig,
  MatchSettings,
  MatchPhase,
  TapEvent,
  TapPayload,
} from '@finger-fight/shared';
import {
  DEFAULT_MATCH_SETTINGS,
  ROUND_DEFINITIONS,
  calculateScore,
  validateTaps,
  GameTimer,
  CountdownTimer,
  generateCPUTaps,
  generateCPUReverseRoundTaps,
  type CPUDifficulty,
  type RoundType,
} from '@finger-fight/shared';

export type GameMode = 'solo' | 'cpu' | 'local' | 'online';

export const useGameStore = defineStore('game', () => {
  // ─── State ────────────────────────────────────────────
  const mode = ref<GameMode>('solo');
  const phase = ref<MatchPhase>('idle');
  const players = ref<Player[]>([]);
  const scores = ref<PlayerScore[]>([]);
  const currentRound = ref(0);
  const totalRounds = ref(7);
  const roundConfig = ref<RoundConfig | null>(null);
  const roundTimeRemaining = ref(0);
  const countdownValue = ref(0);
  const matchId = ref('');
  const rounds = ref<RoundConfig[]>([]);
  const cpuDifficulty = ref<CPUDifficulty>('normal');
  const localPlayerCount = ref(2);
  const settings = ref<MatchSettings>({ ...DEFAULT_MATCH_SETTINGS });

  // Tap collection
  const tapBuffer = ref<TapEvent[]>([]);
  const roundStartTime = ref(0);

  // Timers
  const gameTimer = new GameTimer();
  const countdown = new CountdownTimer();

  // ─── Computed ─────────────────────────────────────────
  const currentPlayer = computed(() => players.value.find((p) => !p.isCPU));
  const isPlaying = computed(() => phase.value === 'playing');
  const isMatchOver = computed(() => phase.value === 'final-podium');
  const winner = computed(() => {
    if (scores.value.length === 0) return null;
    return scores.value.reduce((best, s) =>
      s.totalScore > best.totalScore ? s : best
    );
  });

  // ─── Actions ──────────────────────────────────────────
  function startMatch(gameMode: GameMode, playerList: Player[]) {
    mode.value = gameMode;
    players.value = playerList;
    currentRound.value = 0;
    matchId.value = crypto.randomUUID?.() || Date.now().toString();

    // Initialize scores
    scores.value = playerList.map((p) => ({
      playerId: p.id,
      roundScores: [],
      totalScore: 0,
    }));

    // Generate rounds
    rounds.value = generateRounds(playerList);
    totalRounds.value = rounds.value.length;

    phase.value = 'countdown';
    startCountdown();
  }

  function generateRounds(playerList: Player[]): RoundConfig[] {
    const types = settings.value.roundTypes;
    const total = settings.value.totalRounds;
    const defaultDur = settings.value.defaultRoundDuration;
    const result: RoundConfig[] = [];

    for (let i = 0; i < total; i++) {
      const isLast = i === total - 1;
      const isSpotlight = !isLast && i % 3 === 2 && playerList.length > 1;

      let type: RoundType;
      if (i === 0) {
        type = 'classic';
      } else if (isLast) {
        const exciting: RoundType[] = ['steal', 'golden'];
        type = pickRandom(exciting.filter((t) => types.includes(t))) || 'classic';
      } else {
        const prev = result[i - 1]?.type;
        const avail = types.filter((t) => t !== prev);
        type = pickRandom(avail.length > 0 ? avail : types) || 'classic';
      }

      const def = ROUND_DEFINITIONS[type];
      const dp = def.modifiers.durationPolicy;
      const duration = dp.type === 'fixed' ? dp.seconds : defaultDur;

      result.push({
        ...def,
        duration,
        isSpotlight,
        spotlightPlayerId: isSpotlight
          ? playerList[i % playerList.length].id
          : undefined,
        isFinalTwist: isLast,
      });
    }

    return result;
  }

  function startCountdown() {
    phase.value = 'countdown';
    countdown.start(
      3,
      (count) => {
        countdownValue.value = count;
      },
      () => {
        countdownValue.value = 0;
        showRoundIntro();
      }
    );
  }

  function showRoundIntro() {
    if (currentRound.value >= rounds.value.length) {
      showFinalPodium();
      return;
    }

    roundConfig.value = rounds.value[currentRound.value];
    phase.value = 'round-intro';

    setTimeout(() => {
      startRound();
    }, 2500);
  }

  function startRound() {
    tapBuffer.value = [];
    roundStartTime.value = Date.now();
    phase.value = 'playing';

    const duration = roundConfig.value?.duration || 6;
    roundTimeRemaining.value = duration;

    gameTimer.start(duration, {
      onTick: (remaining) => {
        roundTimeRemaining.value = Math.round(remaining * 10) / 10;
      },
      onComplete: () => {
        endRound();
      },
    });
  }

  function recordTap(tap: TapEvent) {
    if (phase.value !== 'playing') return;
    tapBuffer.value.push(tap);
  }

  function endRound() {
    gameTimer.stop();
    phase.value = 'round-results';

    const config = roundConfig.value;
    if (!config) return;

    // Process each player's taps
    for (const player of players.value) {
      let taps: TapEvent[];

      if (player.isCPU) {
        // Generate CPU taps
        taps =
          config.type === 'reverse'
            ? generateCPUReverseRoundTaps(cpuDifficulty.value, config.duration, 400, 600)
            : generateCPUTaps(cpuDifficulty.value, config.duration, 400, 600);
      } else {
        // Use player's recorded taps
        taps = tapBuffer.value.filter(
          (t) => t.fingerId !== undefined // all user taps
        );
      }

      // Validate
      const { validTaps } = validateTaps(taps);

      // Score
      const opponentIds = players.value
        .filter((p) => p.id !== player.id)
        .map((p) => p.id);

      const result = calculateScore({
        rule: config.modifiers.scoringRule,
        taps: validTaps,
        zoneWidth: 400,
        zoneHeight: 600,
        roundDuration: config.duration,
        currentScore: getPlayerTotal(player.id),
        opponentIds,
      });

      // Update scores
      const ps = scores.value.find((s) => s.playerId === player.id);
      if (ps) {
        ps.roundScores.push(result.points);
        ps.totalScore = ps.roundScores.reduce((a, b) => a + b, 0);
      }

      // Apply steals
      if (result.stolenPoints) {
        for (const [targetId, stolen] of Object.entries(result.stolenPoints)) {
          const ts = scores.value.find((s) => s.playerId === targetId);
          if (ts) {
            ts.totalScore = Math.max(0, ts.totalScore - stolen);
          }
        }
      }
    }

    // Sort scores
    scores.value.sort((a, b) => b.totalScore - a.totalScore);

    currentRound.value++;

    // Next round or finish
    setTimeout(() => {
      if (currentRound.value >= totalRounds.value) {
        showFinalPodium();
      } else {
        showRoundIntro();
      }
    }, 3000);
  }

  function showFinalPodium() {
    phase.value = 'final-podium';
    scores.value.sort((a, b) => b.totalScore - a.totalScore);
  }

  function getPlayerTotal(playerId: string): number {
    const ps = scores.value.find((s) => s.playerId === playerId);
    return ps?.totalScore || 0;
  }

  function getPlayer(playerId: string): Player | undefined {
    return players.value.find((p) => p.id === playerId);
  }

  function reset() {
    phase.value = 'idle';
    players.value = [];
    scores.value = [];
    currentRound.value = 0;
    roundConfig.value = null;
    tapBuffer.value = [];
    gameTimer.stop();
    countdown.stop();
  }

  function updatePhase(newPhase: MatchPhase) {
    phase.value = newPhase;
  }

  function setRoundConfig(config: RoundConfig) {
    roundConfig.value = config;
  }

  function setScores(newScores: PlayerScore[]) {
    scores.value = newScores;
  }

  function setTimeRemaining(time: number) {
    roundTimeRemaining.value = time;
  }

  return {
    // State
    mode,
    phase,
    players,
    scores,
    currentRound,
    totalRounds,
    roundConfig,
    roundTimeRemaining,
    countdownValue,
    tapBuffer,
    cpuDifficulty,
    localPlayerCount,
    settings,
    // Computed
    currentPlayer,
    isPlaying,
    isMatchOver,
    winner,
    // Actions
    startMatch,
    recordTap,
    reset,
    getPlayer,
    updatePhase,
    setRoundConfig,
    setScores,
    setTimeRemaining,
    showRoundIntro,
    endRound,
    startRound,
  };
});

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}
