<template>
  <div class="score-bar">
    <div
      v-for="score in sortedScores"
      :key="score.playerId"
      class="score-item"
    >
      <span class="score-dot" :style="{ background: getColor(score.playerId) }"></span>
      <span class="score-name">{{ getName(score.playerId) }}</span>
      <span class="score-value" :style="{ color: getColor(score.playerId) }">
        {{ score.totalScore }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player, PlayerScore } from '@finger-fight/shared';

const props = defineProps<{
  scores: PlayerScore[];
  players: Player[];
}>();

const sortedScores = computed(() =>
  [...props.scores].sort((a, b) => b.totalScore - a.totalScore)
);

function getColor(playerId: string): string {
  return props.players.find((p) => p.id === playerId)?.color || '#fff';
}

function getName(playerId: string): string {
  const p = props.players.find((p) => p.id === playerId);
  return p?.nickname?.substring(0, 8) || '???';
}
</script>

<style scoped>
.score-bar {
  display: flex;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.25);
  overflow-x: auto;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.score-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.score-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.score-value {
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
}
</style>
