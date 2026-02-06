<template>
  <div class="countdown-overlay">
    <div class="countdown-number animate-bounce-in" :key="count">
      {{ count === 0 ? 'GO!' : count }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
}>();
</script>

<style scoped>
.countdown-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.95);
  z-index: 50;
}

.countdown-number {
  font-size: 120px;
  font-weight: 900;
  color: var(--accent);
  text-shadow: 0 0 60px var(--accent-glow);
  animation: countdown-pop 0.5s ease-out;
}
</style>
