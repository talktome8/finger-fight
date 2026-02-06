<template>
  <div class="screen screen-center home-screen">
    <div class="home-content">
      <!-- Logo -->
      <div class="logo animate-bounce-in">
        <div class="logo-emoji">🥊</div>
        <h1 class="logo-title">FINGER<br/><span class="logo-accent">FIGHT</span></h1>
        <p class="logo-tagline">Tap. Compete. Dominate.</p>
      </div>

      <!-- Main Actions -->
      <div class="home-actions animate-slide-up">
        <button class="btn btn-primary btn-lg btn-block animate-glow" @click="goToMode">
          🎮 PLAY
        </button>
        <button class="btn btn-secondary btn-block" @click="goToSettings">
          ⚙️ Settings
        </button>
      </div>

      <!-- Version -->
      <p class="version">v1.0.0 • Made with 💥</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToMode() {
  router.push('/mode');
}

function goToSettings() {
  router.push('/settings');
}
</script>

<style scoped>
.home-screen {
  background: radial-gradient(ellipse at center top, #2a2a4e 0%, var(--bg-primary) 70%);
}

.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  padding: 20px;
}

.logo {
  text-align: center;
}

.logo-emoji {
  font-size: 80px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.logo-title {
  font-size: 52px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 4px;
  color: white;
}

.logo-accent {
  color: var(--accent);
  text-shadow: 0 0 40px var(--accent-glow);
}

.logo-tagline {
  margin-top: 12px;
  font-size: 16px;
  color: var(--text-secondary);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.home-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 300px;
}

.version {
  font-size: 12px;
  color: var(--text-muted);
  position: absolute;
  bottom: calc(20px + var(--safe-bottom));
}
</style>
