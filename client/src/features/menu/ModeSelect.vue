<template>
  <div class="screen mode-screen">
    <button class="back-btn" @click="$router.push('/')">←</button>

    <h2 class="title text-center mt-lg">Choose Mode</h2>
    <p class="subtitle text-center mb-lg">How do you want to play?</p>

    <div class="mode-grid">
      <!-- Solo -->
      <button class="mode-card" @click="startSolo">
        <span class="mode-icon">🎯</span>
        <span class="mode-name">Solo</span>
        <span class="mode-desc">Beat your best score</span>
        <span class="mode-badge offline">Offline</span>
      </button>

      <!-- VS CPU -->
      <button class="mode-card" @click="startCPU">
        <span class="mode-icon">🤖</span>
        <span class="mode-name">vs CPU</span>
        <span class="mode-desc">Face a bot opponent</span>
        <span class="mode-badge offline">Offline</span>
      </button>

      <!-- Local Multiplayer -->
      <button class="mode-card" @click="startLocal">
        <span class="mode-icon">📱</span>
        <span class="mode-name">Same Device</span>
        <span class="mode-desc">2-4 players, one screen</span>
        <span class="mode-badge offline">Offline</span>
      </button>

      <!-- Online Multiplayer -->
      <button class="mode-card" @click="startOnline">
        <span class="mode-icon">🌐</span>
        <span class="mode-name">Online</span>
        <span class="mode-desc">Play across devices</span>
        <span class="mode-badge online">Online</span>
      </button>
    </div>

    <!-- CPU Difficulty Picker (shown when cpu mode selected) -->
    <div v-if="showCpuPicker" class="difficulty-overlay" @click.self="showCpuPicker = false">
      <div class="difficulty-modal animate-bounce-in">
        <h3>CPU Difficulty</h3>
        <div class="difficulty-options">
          <button
            v-for="d in difficulties"
            :key="d.value"
            class="btn btn-block"
            :class="d.value === selectedDifficulty ? 'btn-primary' : 'btn-secondary'"
            @click="selectedDifficulty = d.value"
          >
            {{ d.icon }} {{ d.label }}
          </button>
        </div>
        <button class="btn btn-primary btn-block mt-md" @click="launchCPU">
          START MATCH
        </button>
      </div>
    </div>

    <!-- Local Player Count Picker -->
    <div v-if="showLocalPicker" class="difficulty-overlay" @click.self="showLocalPicker = false">
      <div class="difficulty-modal animate-bounce-in">
        <h3>How Many Players?</h3>
        <div class="difficulty-options">
          <button
            v-for="count in [2, 3, 4]"
            :key="count"
            class="btn btn-block"
            :class="count === selectedPlayerCount ? 'btn-primary' : 'btn-secondary'"
            @click="selectedPlayerCount = count"
          >
            {{ count }} Players
          </button>
        </div>
        <button class="btn btn-primary btn-block mt-md" @click="launchLocal">
          START MATCH
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore, type GameMode } from '@/stores/game';
import type { Player, PlayerColor } from '@finger-fight/shared';
import { PLAYER_COLORS } from '@finger-fight/shared';
import type { CPUDifficulty } from '@finger-fight/shared';

const router = useRouter();
const game = useGameStore();

const showCpuPicker = ref(false);
const showLocalPicker = ref(false);
const selectedDifficulty = ref<CPUDifficulty>('normal');
const selectedPlayerCount = ref(2);

const difficulties = [
  { value: 'easy' as CPUDifficulty, label: 'Easy', icon: '😊' },
  { value: 'normal' as CPUDifficulty, label: 'Normal', icon: '😤' },
  { value: 'aggressive' as CPUDifficulty, label: 'Aggressive', icon: '🔥' },
];

function startSolo() {
  const player = createPlayer('You', 0, false);
  game.startMatch('solo', [player]);
  router.push('/game');
}

function startCPU() {
  showCpuPicker.value = true;
}

function launchCPU() {
  showCpuPicker.value = false;
  game.cpuDifficulty = selectedDifficulty.value;
  const player = createPlayer('You', 0, false);
  const cpu = createPlayer('CPU', 1, true);
  game.startMatch('cpu', [player, cpu]);
  router.push('/game');
}

function startLocal() {
  showLocalPicker.value = true;
}

function launchLocal() {
  showLocalPicker.value = false;
  const players: Player[] = [];
  const names = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  for (let i = 0; i < selectedPlayerCount.value; i++) {
    players.push(createPlayer(names[i], i, false));
  }
  game.startMatch('local', players);
  router.push('/game');
}

function startOnline() {
  router.push('/lobby');
}

function createPlayer(name: string, index: number, isCPU: boolean): Player {
  return {
    id: isCPU ? `cpu-${index}` : `local-${index}`,
    nickname: name,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    isHost: index === 0,
    isCPU,
    deviceId: `device-${index}`,
    connected: true,
  };
}
</script>

<style scoped>
.mode-screen {
  padding-top: calc(60px + var(--safe-top));
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  align-content: start;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 12px;
  background: var(--bg-card);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  font-family: var(--font-display);
}

.mode-card:active {
  transform: scale(0.95);
  border-color: var(--accent);
}

.mode-icon {
  font-size: 40px;
}

.mode-name {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
}

.mode-desc {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
}

.mode-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 20px;
  margin-top: 4px;
}

.mode-badge.offline {
  background: rgba(107, 203, 119, 0.2);
  color: var(--success);
}

.mode-badge.online {
  background: rgba(75, 171, 255, 0.2);
  color: var(--info);
}

/* Modal overlay */
.difficulty-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}

.difficulty-modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 340px;
  text-align: center;
}

.difficulty-modal h3 {
  font-size: 22px;
  margin-bottom: 16px;
}

.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
