<template>
  <div class="round-results-overlay">
    <div class="round-results-content animate-bounce-in">
      <div class="round-complete-label label">ROUND {{ roundNumber }} COMPLETE</div>
      <div class="round-type-badge">{{ roundConfig.icon }} {{ roundConfig.title }}</div>

      <div class="results-list">
        <div
          v-for="(score, index) in sortedScores"
          :key="score.playerId"
          class="result-item animate-slide-up"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <span class="result-rank">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}` }}</span>
          <span class="result-dot" :style="{ background: getColor(score.playerId) }"></span>
          <span class="result-name">{{ getName(score.playerId) }}</span>
          <span class="result-round-score" :style="{ color: getColor(score.playerId) }">
            +{{ getLatestRoundScore(score) }}
          </span>
          <span class="result-total">{{ score.totalScore }}</span>
        </div>
      </div>

      <div class="next-round-hint">
        <span class="loading-dots">Next round starting</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player, PlayerScore, RoundConfig } from '@finger-fight/shared';

const props = defineProps<{
  scores: PlayerScore[];
  players: Player[];
  roundNumber: number;
  roundConfig: RoundConfig;
}>();

const sortedScores = computed(() =>
  [...props.scores].sort((a, b) => b.totalScore - a.totalScore)
);

function getColor(playerId: string): string {
  return props.players.find((p) => p.id === playerId)?.color || '#fff';
}

function getName(playerId: string): string {
  return props.players.find((p) => p.id === playerId)?.nickname || '???';
}

function getLatestRoundScore(score: PlayerScore): number {
  if (score.roundScores.length === 0) return 0;
  return score.roundScores[score.roundScores.length - 1];
}
</script>

<style scoped>
.round-results-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.95);
  z-index: 50;
  padding: 24px;
}

.round-results-content {
  width: 100%;
  max-width: 360px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.round-complete-label {
  color: var(--text-muted);
}

.round-type-badge {
  font-size: 18px;
  font-weight: 800;
  color: var(--accent);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
}

.result-rank {
  font-size: 18px;
  width: 32px;
  text-align: center;
}

.result-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.result-name {
  flex: 1;
  font-weight: 600;
  text-align: left;
}

.result-round-score {
  font-size: 14px;
  font-weight: 700;
}

.result-total {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  min-width: 40px;
  text-align: right;
}

.next-round-hint {
  color: var(--text-muted);
  font-size: 13px;
}

.loading-dots::after {
  content: '';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
}
</style>
