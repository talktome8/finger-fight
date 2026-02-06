import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'finger-fight-settings';

export const useSettingsStore = defineStore('settings', () => {
  const nickname = ref(loadSetting('nickname', ''));
  const soundEnabled = ref(loadSetting('soundEnabled', true));
  const vibrationEnabled = ref(loadSetting('vibrationEnabled', true));
  const serverUrl = ref(loadSetting('serverUrl', getDefaultServerUrl()));

  function getDefaultServerUrl(): string {
    // In production, derive WS URL from page URL (same host)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }
    return 'ws://localhost:3001';
  }

  function loadSetting<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function saveSetting(key: string, value: unknown) {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(value));
    } catch {
      // Storage may be unavailable
    }
  }

  // Auto-save on changes
  watch(nickname, (v) => saveSetting('nickname', v));
  watch(soundEnabled, (v) => saveSetting('soundEnabled', v));
  watch(vibrationEnabled, (v) => saveSetting('vibrationEnabled', v));
  watch(serverUrl, (v) => saveSetting('serverUrl', v));

  function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (!vibrationEnabled.value) return;
    try {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate?.(durations[type]);
    } catch {
      // Vibration not supported
    }
  }

  return {
    nickname,
    soundEnabled,
    vibrationEnabled,
    serverUrl,
    triggerHaptic,
  };
});
