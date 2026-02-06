<template>
  <div class="screen lobby-screen">
    <button class="back-btn" @click="leaveLobby">←</button>

    <div class="lobby-content">
      <!-- Decide: Create or Join -->
      <div v-if="!lobby.connected" class="lobby-choice animate-slide-up">
        <h2 class="title text-center">Multiplayer</h2>
        <p class="subtitle text-center mb-lg">Play across devices</p>

        <div class="nickname-input mb-md">
          <input
            v-model="nickname"
            class="input"
            placeholder="Your nickname"
            maxlength="12"
          />
        </div>

        <div class="lobby-buttons">
          <button class="btn btn-primary btn-block" @click="createRoom" :disabled="!nickname.trim()">
            🏠 Create Room
          </button>
          <button class="btn btn-secondary btn-block" @click="$router.push('/join')">
            🔗 Join Room
          </button>
        </div>

        <p v-if="lobby.error" class="error-msg mt-md">{{ lobby.error }}</p>
      </div>

      <!-- Room Created - Waiting -->
      <div v-else class="room-view animate-slide-up">
        <h2 class="title text-center">Room Ready!</h2>

        <!-- Room Code -->
        <div class="room-code-box">
          <span class="label">ROOM CODE</span>
          <span class="room-code">{{ lobby.roomCode }}</span>
          <button class="btn btn-ghost" @click="copyCode" style="font-size: 12px; padding: 6px 12px;">
            📋 Copy
          </button>
        </div>

        <!-- QR Code (simplified text-based) -->
        <div class="qr-placeholder">
          <div class="qr-text">📱 Share room code:<br/><strong>{{ lobby.roomCode }}</strong></div>
        </div>

        <!-- Players -->
        <div class="player-list">
          <span class="label">PLAYERS ({{ lobby.playerCount }}/4)</span>
          <div
            v-for="player in lobby.players"
            :key="player.id"
            class="player-item"
            :style="{ borderLeftColor: player.color }"
          >
            <span class="player-dot" :style="{ background: player.color }"></span>
            <span class="player-name">{{ player.nickname }}</span>
            <span v-if="player.isHost" class="host-badge">HOST</span>
          </div>
        </div>

        <!-- Start Button -->
        <button
          v-if="lobby.isHost"
          class="btn btn-primary btn-lg btn-block mt-md"
          :disabled="!lobby.canStart"
          @click="startOnlineMatch"
        >
          🚀 START MATCH
        </button>
        <p v-else class="subtitle text-center mt-md">Waiting for host to start...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLobbyStore } from '@/stores/lobby';
import { useSettingsStore } from '@/stores/settings';
import { useGameStore } from '@/stores/game';
import { useNetwork, setupNetworkHandlers } from '@/network/client';

const router = useRouter();
const lobby = useLobbyStore();
const settings = useSettingsStore();
const game = useGameStore();
const network = useNetwork();

const nickname = ref(settings.nickname || '');

onMounted(() => {
  setupNetworkHandlers(network);

  // Listen for match start
  network.on('match-starting', () => {
    game.updatePhase('countdown');
    router.push('/game');
  });
});

async function createRoom() {
  if (!nickname.value.trim()) return;

  try {
    await network.connect(settings.serverUrl);
    network.send({ type: 'create-room', nickname: nickname.value.trim() });
    settings.nickname = nickname.value.trim();
  } catch {
    lobby.setError('Could not connect to server');
  }
}

async function startOnlineMatch() {
  network.send({ type: 'start-match' });
}

function copyCode() {
  navigator.clipboard?.writeText(lobby.roomCode);
}

function leaveLobby() {
  if (lobby.connected) {
    network.send({ type: 'leave-room' });
    network.disconnect();
  }
  lobby.reset();
  router.push('/mode');
}

onUnmounted(() => {
  // Don't disconnect if going to game
  if (router.currentRoute.value.name !== 'game') {
    // Network stays alive
  }
});
</script>

<style scoped>
.lobby-screen {
  padding-top: calc(60px + var(--safe-top));
}

.lobby-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lobby-choice, .room-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lobby-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-code-box {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.room-code {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 8px;
  color: var(--accent);
  text-shadow: 0 0 20px var(--accent-glow);
}

.qr-placeholder {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
}

.qr-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  border-left: 4px solid;
}

.player-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.player-name {
  flex: 1;
  font-weight: 600;
}

.host-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--accent);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.error-msg {
  color: var(--danger);
  text-align: center;
  font-size: 14px;
}
</style>
