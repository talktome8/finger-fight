<template>
  <div class="screen settings-screen">
    <button class="back-btn" @click="$router.back()">←</button>

    <h2 class="title text-center mt-lg">Settings</h2>

    <div class="settings-list mt-lg">
      <!-- Nickname -->
      <div class="setting-item">
        <label class="setting-label">Nickname</label>
        <input
          v-model="settings.nickname"
          class="input"
          placeholder="Enter your name"
          maxlength="12"
        />
      </div>

      <!-- Sound -->
      <div class="setting-item setting-toggle" @click="settings.soundEnabled = !settings.soundEnabled">
        <span class="setting-label">🔊 Sound Effects</span>
        <div class="toggle" :class="{ active: settings.soundEnabled }">
          <div class="toggle-knob" />
        </div>
      </div>

      <!-- Vibration -->
      <div class="setting-item setting-toggle" @click="settings.vibrationEnabled = !settings.vibrationEnabled">
        <span class="setting-label">📳 Vibration</span>
        <div class="toggle" :class="{ active: settings.vibrationEnabled }">
          <div class="toggle-knob" />
        </div>
      </div>

      <!-- Server URL -->
      <div class="setting-item">
        <label class="setting-label">Server URL</label>
        <input
          v-model="settings.serverUrl"
          class="input"
          placeholder="ws://localhost:3001"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';

const settings = useSettingsStore();
</script>

<style scoped>
.settings-screen {
  padding-top: calc(60px + var(--safe-top));
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.setting-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.setting-toggle .setting-label {
  margin-bottom: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.toggle {
  width: 50px;
  height: 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  position: relative;
  transition: background 0.3s;
}

.toggle.active {
  background: var(--accent);
}

.toggle-knob {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
}

.toggle.active .toggle-knob {
  transform: translateX(22px);
}
</style>
