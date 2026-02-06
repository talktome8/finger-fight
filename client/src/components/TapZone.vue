<template>
  <div
    class="tap-zone"
    :class="{ disabled: disabled, spotlight: roundConfig.isSpotlight }"
    :style="{
      '--player-color': player.color,
      borderColor: player.color,
    }"
    ref="zoneRef"
    @touchstart.prevent="onTouch"
    @mousedown.prevent="onMouse"
  >
    <!-- Player Label -->
    <div class="tap-zone-label">
      <span class="tap-zone-dot" :style="{ background: player.color }"></span>
      <span>{{ player.nickname }}</span>
    </div>

    <!-- Tap Counter -->
    <div class="tap-counter" :style="{ color: player.color }">
      {{ tapCount }}
    </div>

    <!-- Precision Target -->
    <div
      v-if="roundConfig.type === 'precision'"
      class="precision-target"
      :style="precisionTargetStyle"
    >
      <div class="precision-ring ring-1"></div>
      <div class="precision-ring ring-2"></div>
      <div class="precision-ring ring-3"></div>
    </div>

    <!-- Cooldown Meter -->
    <div v-if="roundConfig.type === 'cooldown'" class="cooldown-meter">
      <div class="cooldown-fill" :style="{ width: cooldownLevel + '%' }" :class="{ overheated: cooldownLevel > 80 }"></div>
      <span class="cooldown-label">{{ cooldownLevel > 80 ? '🔥 TOO FAST!' : '❄️ Keep Cool' }}</span>
    </div>

    <!-- Golden Targets -->
    <div
      v-for="gt in goldenTargets"
      :key="gt.id"
      class="golden-target animate-bounce-in"
      :style="{ left: gt.x + '%', top: gt.y + '%' }"
      @touchstart.stop.prevent="hitGolden(gt)"
      @mousedown.stop.prevent="hitGolden(gt)"
    >
      ⭐
    </div>

    <!-- Tap Ripples -->
    <div
      v-for="ripple in ripples"
      :key="ripple.id"
      class="tap-ripple"
      :style="{
        left: ripple.x + 'px',
        top: ripple.y + 'px',
        '--ripple-color': player.color,
      }"
    />

    <!-- CPU Indicator -->
    <div v-if="disabled" class="cpu-overlay">
      🤖
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import type { Player, RoundConfig, TapEvent } from '@finger-fight/shared';

const props = defineProps<{
  player: Player;
  roundConfig: RoundConfig;
  disabled: boolean;
  zoneIndex: number;
}>();

const emit = defineEmits<{
  (e: 'tap', tap: TapEvent): void;
}>();

const zoneRef = ref<HTMLElement | null>(null);
const tapCount = ref(0);
const cooldownLevel = ref(0);
const ripples = ref<Array<{ id: number; x: number; y: number }>>([]);
const goldenTargets = reactive<Array<{ id: number; x: number; y: number; hit: boolean }>>([]);
let rippleId = 0;
let recentTaps: number[] = [];
let goldenId = 0;
let goldenInterval: ReturnType<typeof setInterval> | null = null;

const precisionTargetStyle = computed(() => {
  return {
    width: '120px',
    height: '120px',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };
});

function onTouch(e: TouchEvent) {
  if (props.disabled) return;
  const rect = zoneRef.value?.getBoundingClientRect();
  if (!rect) return;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    processTap(x, y, touch.identifier);
  }
}

function onMouse(e: MouseEvent) {
  if (props.disabled) return;
  const rect = zoneRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  processTap(x, y, 0);
}

function processTap(x: number, y: number, fingerId: number) {
  tapCount.value++;

  // Add ripple
  addRipple(x, y);

  // Track for cooldown
  const now = Date.now();
  recentTaps.push(now);
  recentTaps = recentTaps.filter((t) => now - t < 1000);

  // Update cooldown meter
  cooldownLevel.value = Math.min(100, (recentTaps.length / 15) * 100);

  // Emit tap event
  emit('tap', {
    timestamp: now,
    x: Math.round(x),
    y: Math.round(y),
    fingerId,
  });
}

function addRipple(x: number, y: number) {
  const id = ++rippleId;
  ripples.value.push({ id, x, y });
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id);
  }, 500);
}

function hitGolden(target: { id: number; x: number; y: number; hit: boolean }) {
  if (target.hit) return;
  target.hit = true;

  // Emit a golden tap (y < 0 convention)
  emit('tap', {
    timestamp: Date.now(),
    x: Math.round(target.x),
    y: -1,
    fingerId: 0,
  });

  // Remove after animation
  setTimeout(() => {
    const idx = goldenTargets.findIndex((g) => g.id === target.id);
    if (idx >= 0) goldenTargets.splice(idx, 1);
  }, 300);
}

onMounted(() => {
  // Spawn golden targets for golden rounds
  if (props.roundConfig.type === 'golden') {
    goldenInterval = setInterval(() => {
      const id = ++goldenId;
      goldenTargets.push({
        id,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        hit: false,
      });
      // Auto-remove after 800ms
      setTimeout(() => {
        const idx = goldenTargets.findIndex((g) => g.id === id);
        if (idx >= 0) goldenTargets.splice(idx, 1);
      }, 800);
    }, 1500);
  }
});

onUnmounted(() => {
  if (goldenInterval) clearInterval(goldenInterval);
});
</script>

<style scoped>
.tap-zone {
  flex: 1;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(var(--player-color-rgb, 255, 255, 255), 0.05) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
  min-height: 100px;
}

.tap-zone:active {
  background: rgba(255, 255, 255, 0.08);
}

.tap-zone.disabled {
  pointer-events: none;
  opacity: 0.5;
}

.tap-zone-label {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  z-index: 5;
}

.tap-zone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tap-counter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 64px;
  font-weight: 900;
  opacity: 0.3;
  pointer-events: none;
  z-index: 1;
}

/* Precision target */
.precision-target {
  position: absolute;
  border-radius: 50%;
  z-index: 3;
}

.precision-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.precision-ring.ring-1 {
  border-color: var(--accent);
  opacity: 0.8;
}

.precision-ring.ring-2 {
  inset: 20%;
  border-color: var(--warning);
}

.precision-ring.ring-3 {
  inset: 40%;
  border-color: var(--success);
  background: rgba(107, 203, 119, 0.1);
}

/* Cooldown meter */
.cooldown-meter {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 5;
}

.cooldown-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--info), var(--success));
  transition: width 0.15s;
  border-radius: 0 4px 4px 0;
}

.cooldown-fill.overheated {
  background: linear-gradient(90deg, var(--warning), var(--danger));
}

.cooldown-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: white;
}

/* Golden targets */
.golden-target {
  position: absolute;
  font-size: 32px;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: pointer;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.6));
  animation: float 0.5s ease-in-out infinite;
}

/* Tap ripple */
.tap-ripple {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--ripple-color, rgba(255, 255, 255, 0.3));
  opacity: 0.5;
  pointer-events: none;
  animation: tap-ripple 0.5s ease-out forwards;
  z-index: 4;
}

/* CPU overlay */
.cpu-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 20;
}
</style>
