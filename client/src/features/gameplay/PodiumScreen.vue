<template>
  <div class="screen screen-center podium-screen">
    <div class="podium-content animate-bounce-in">
      <div class="trophy">🏆</div>
      <h1 class="title">Game Over!</h1>

      <!-- Winner -->
      <div v-if="winnerPlayer" class="winner-card">
        <div class="winner-crown">👑</div>
        <div class="winner-name" :style="{ color: winnerPlayer.color }">
          {{ winnerPlayer.nickname }}
        </div>
        <div class="winner-score">{{ game.winner?.totalScore }} pts</div>
      </div>

      <!-- All Scores -->
      <div class="podium-list">
        <div
          v-for="(score, index) in game.scores"
          :key="score.playerId"
          class="podium-item animate-slide-up"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="podium-rank" :class="`rank-${index + 1}`">
            {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}` }}
          </div>
          <div
            class="podium-player-dot"
            :style="{ background: getPlayer(score.playerId)?.color }"
          ></div>
          <div class="podium-name">{{ getPlayer(score.playerId)?.nickname }}</div>
          <div class="podium-score">{{ score.totalScore }}</div>
        </div>
      </div>

      <!-- Round-by-Round Breakdown -->
      <details class="round-breakdown">
        <summary class="label">📊 Round Breakdown</summary>
        <div class="breakdown-grid">
          <div class="breakdown-header">
            <span>Round</span>
            <span v-for="score in game.scores" :key="score.playerId" class="breakdown-player">
              {{ getPlayer(score.playerId)?.nickname?.substring(0, 6) }}
            </span>
          </div>
          <div
            v-for="(_, roundIdx) in game.totalRounds"
            :key="roundIdx"
            class="breakdown-row"
          >
            <span>R{{ roundIdx + 1 }}</span>
            <span
              v-for="score in game.scores"
              :key="score.playerId"
              :style="{ color: getPlayer(score.playerId)?.color }"
            >
              {{ score.roundScores[roundIdx] ?? '-' }}
            </span>
          </div>
        </div>
      </details>

      <!-- Actions -->
      <div class="podium-actions">
        <button class="btn btn-primary btn-lg btn-block" @click="playAgain">
          🔄 Play Again
        </button>
        <button class="btn btn-ghost btn-block" @click="goHome">
          🏠 Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';

const router = useRouter();
const game = useGameStore();

const winnerPlayer = computed(() => {
  if (!game.winner) return null;
  return game.getPlayer(game.winner.playerId);
});

function getPlayer(id: string) {
  return game.getPlayer(id);
}

function playAgain() {
  const mode = game.mode;
  const players = [...game.players];
  game.reset();
  game.startMatch(mode, players);
}

function goHome() {
  game.reset();
  router.push('/');
}
</script>

<style scoped>
.podium-screen {
  padding: 16px;
  overflow-y: auto;
  justify-content: flex-start;
  padding-top: calc(40px + var(--safe-top));
}

.podium-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.trophy {
  font-size: 64px;
  animation: float 3s ease-in-out infinite;
}

.winner-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  text-align: center;
  width: 100%;
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.15);
}

.winner-crown {
  font-size: 36px;
}

.winner-name {
  font-size: 28px;
  font-weight: 900;
  text-transform: uppercase;
}

.winner-score {
  font-size: 20px;
  color: var(--text-secondary);
  font-weight: 700;
}

.podium-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.podium-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
}

.podium-rank {
  font-size: 20px;
  width: 36px;
  text-align: center;
}

.podium-player-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.podium-name {
  flex: 1;
  font-weight: 700;
}

.podium-score {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
}

.round-breakdown {
  width: 100%;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 12px;
}

.round-breakdown summary {
  cursor: pointer;
  text-align: center;
  padding: 4px;
}

.breakdown-grid {
  margin-top: 8px;
  font-size: 12px;
}

.breakdown-header,
.breakdown-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.breakdown-header {
  font-weight: 700;
  color: var(--text-muted);
}

.breakdown-header span,
.breakdown-row span {
  flex: 1;
  text-align: center;
}

.breakdown-header span:first-child,
.breakdown-row span:first-child {
  flex: 0.5;
  text-align: left;
}

.podium-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
</style>
