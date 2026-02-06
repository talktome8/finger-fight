<template>
  <div class="round-intro-overlay">
    <div class="round-intro-content animate-bounce-in">
      <div class="round-number label">ROUND {{ roundNumber }} / {{ totalRounds }}</div>
      <div class="round-icon">{{ config.icon }}</div>
      <h2 class="round-title">{{ config.title }}</h2>
      <p class="round-desc">{{ config.description }}</p>
      <div v-if="config.isSpotlight" class="spotlight-badge">
        🔦 SPOTLIGHT ROUND
      </div>
      <div v-if="config.isFinalTwist" class="final-badge animate-pulse">
        ⚡ FINAL ROUND
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoundConfig } from '@finger-fight/shared';

defineProps<{
  config: RoundConfig;
  roundNumber: number;
  totalRounds: number;
}>();
</script>

<style scoped>
.round-intro-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.95);
  z-index: 50;
  padding: 24px;
}

.round-intro-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.round-number {
  font-size: 14px;
  color: var(--text-muted);
}

.round-icon {
  font-size: 72px;
  animation: float 2s ease-in-out infinite;
}

.round-title {
  font-size: 32px;
  font-weight: 900;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 3px;
}

.round-desc {
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 280px;
}

.spotlight-badge,
.final-badge {
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.spotlight-badge {
  background: rgba(75, 171, 255, 0.2);
  color: var(--info);
  border: 1px solid rgba(75, 171, 255, 0.3);
}

.final-badge {
  background: rgba(233, 69, 96, 0.2);
  color: var(--accent);
  border: 1px solid rgba(233, 69, 96, 0.3);
}
</style>
