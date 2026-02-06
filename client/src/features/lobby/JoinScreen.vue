<template>
  <div class="screen screen-center join-screen">
    <button class="back-btn" @click="$router.push('/lobby')">←</button>

    <div class="join-content animate-slide-up">
      <h2 class="title">Join Room</h2>
      <p class="subtitle mb-lg">Enter the room code to join</p>

      <input
        v-model="nickname"
        class="input mb-md"
        placeholder="Your nickname"
        maxlength="12"
      />

      <input
        v-model="code"
        class="input room-code-input mb-md"
        placeholder="ROOM CODE"
        maxlength="5"
        @input="code = code.toUpperCase()"
      />

      <button
        class="btn btn-primary btn-lg btn-block"
        :disabled="!canJoin"
        @click="joinRoom"
      >
        JOIN
      </button>

      <p v-if="error" class="error-msg mt-md">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLobbyStore } from '@/stores/lobby';
import { useSettingsStore } from '@/stores/settings';
import { useNetwork, setupNetworkHandlers } from '@/network/client';

const router = useRouter();
const lobby = useLobbyStore();
const settings = useSettingsStore();
const network = useNetwork();

const nickname = ref(settings.nickname || '');
const code = ref('');
const error = ref('');

const canJoin = computed(() => nickname.value.trim().length > 0 && code.value.length === 5);

async function joinRoom() {
  if (!canJoin.value) return;

  try {
    await network.connect(settings.serverUrl);
    setupNetworkHandlers(network);

    network.send({
      type: 'join-room',
      roomCode: code.value,
      nickname: nickname.value.trim(),
    });

    settings.nickname = nickname.value.trim();

    // Wait for response
    network.on('room-joined', () => {
      router.push('/lobby');
    });

    network.on('error', (msg) => {
      if (msg.type === 'error') {
        error.value = msg.message;
      }
    });
  } catch {
    error.value = 'Could not connect to server';
  }
}
</script>

<style scoped>
.join-screen {
  padding-top: calc(60px + var(--safe-top));
}

.join-content {
  width: 100%;
  max-width: 340px;
  text-align: center;
}

.room-code-input {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 6px;
  text-transform: uppercase;
}

.error-msg {
  color: var(--danger);
  font-size: 14px;
}
</style>
