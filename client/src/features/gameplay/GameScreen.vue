<template>
  <div class="screen game-screen" :class="`phase-${game.phase}`">
    <!-- Countdown Overlay -->
    <CountdownOverlay v-if="game.phase === 'countdown'" :count="game.countdownValue" />

    <!-- Round Intro -->
    <RoundIntro
      v-else-if="game.phase === 'round-intro'"
      :config="game.roundConfig!"
      :roundNumber="game.currentRound + 1"
      :totalRounds="game.totalRounds"
    />

    <!-- Active Gameplay -->
    <div v-else-if="game.phase === 'playing'" class="gameplay-area">
      <!-- Timer Bar -->
      <TimerBar :remaining="game.roundTimeRemaining" :total="game.roundConfig?.duration || 6" />

      <!-- Round Info -->
      <div class="round-header">
        <span class="round-label">Round {{ game.currentRound + 1 }}/{{ game.totalRounds }}</span>
        <span class="round-type">{{ game.roundConfig?.icon }} {{ game.roundConfig?.title }}</span>
      </div>

      <!-- Score Display -->
      <ScoreBar :scores="game.scores" :players="game.players" />

      <!-- Tap Zone(s) -->
      <div class="tap-zones" :class="`players-${tapZoneCount}`">
        <TapZone
          v-for="(player, idx) in activePlayers"
          :key="player.id"
          :player="player"
          :roundConfig="game.roundConfig!"
          :disabled="player.isCPU"
          :zoneIndex="idx"
          @tap="onTap"
        />
      </div>
    </div>

    <!-- Round Results -->
    <RoundResults
      v-else-if="game.phase === 'round-results'"
      :scores="game.scores"
      :players="game.players"
      :roundNumber="game.currentRound"
      :roundConfig="game.roundConfig!"
    />

    <!-- Final Podium -->
    <div v-else-if="game.phase === 'final-podium'" class="podium-redirect">
      <PodiumScreen />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { useSettingsStore } from '@/stores/settings';
import type { TapEvent, Player } from '@finger-fight/shared';
import CountdownOverlay from '@/components/CountdownOverlay.vue';
import RoundIntro from '@/components/RoundIntro.vue';
import TimerBar from '@/components/TimerBar.vue';
import ScoreBar from '@/components/ScoreBar.vue';
import TapZone from '@/components/TapZone.vue';
import RoundResults from '@/components/RoundResults.vue';
import PodiumScreen from './PodiumScreen.vue';

const router = useRouter();
const game = useGameStore();
const settings = useSettingsStore();

const activePlayers = computed(() => {
  if (game.mode === 'solo') return [game.players[0]];
  if (game.mode === 'cpu') return game.players.filter((p) => !p.isCPU);
  if (game.mode === 'local') return game.players;
  return game.players.filter((p) => !p.isCPU);
});

const tapZoneCount = computed(() => activePlayers.value.length);

function onTap(tap: TapEvent) {
  settings.triggerHaptic('light');
  game.recordTap(tap);
}

onUnmounted(() => {
  game.reset();
});
</script>

<style scoped>
.game-screen {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.gameplay-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
}

.round-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.round-type {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}

.tap-zones {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
}

.tap-zones.players-1 {
  /* Single player: full screen tap zone */
}

.tap-zones.players-2 {
  /* Two players: split vertically */
}

.tap-zones.players-3,
.tap-zones.players-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
}

.podium-redirect {
  height: 100%;
}
</style>
