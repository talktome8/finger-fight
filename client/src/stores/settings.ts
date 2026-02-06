import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'finger-fight-settings';

export const useSettingsStore = defineStore('settings', () => {
  const nickname = ref(loadSetting('nickname', ''));
  const soundEnabled = ref(loadSetting('soundEnabled', true));
  const vibrationEnabled = ref(loadSetting('vibrationEnabled', true));
  const serverUrl = ref(loadSetting('serverUrl', getDefaultServerUrl()));

  function getDefaultServerUrl(): string {
    // Production: use Render WebSocket server
    return 'wss://finger-fight.onrender.com';
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
