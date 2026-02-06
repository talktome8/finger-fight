<template>
  <div class="timer-bar">
    <div
      class="timer-fill"
      :class="{ warning: percentage < 30, danger: percentage < 15 }"
      :style="{ width: percentage + '%' }"
    />
    <span class="timer-text">{{ remaining.toFixed(1) }}s</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  remaining: number;
  total: number;
}>();

const percentage = computed(() =>
  Math.max(0, Math.min(100, (props.remaining / props.total) * 100))
);
</script>

<style scoped>
.timer-bar {
  height: 36px;
  background: rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #ff6b6b);
  transition: width 0.1s linear;
  border-radius: 0 4px 4px 0;
}

.timer-fill.warning {
  background: linear-gradient(90deg, var(--warning), #ffaa00);
}

.timer-fill.danger {
  background: linear-gradient(90deg, var(--danger), #ff0000);
  animation: pulse 0.3s ease-in-out infinite;
}

.timer-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
</style>
