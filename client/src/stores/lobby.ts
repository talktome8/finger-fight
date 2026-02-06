import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Player, MatchSettings } from '@finger-fight/shared';
import { DEFAULT_MATCH_SETTINGS } from '@finger-fight/shared';

export const useLobbyStore = defineStore('lobby', () => {
  const roomCode = ref('');
  const playerId = ref('');
  const nickname = ref('');
  const isHost = ref(false);
  const players = ref<Player[]>([]);
  const connected = ref(false);
  const error = ref('');
  const settings = ref<MatchSettings>({ ...DEFAULT_MATCH_SETTINGS });

  const playerCount = computed(() => players.value.length);
  const canStart = computed(() => isHost.value && players.value.length >= 1);

  function setRoom(code: string, id: string, host: boolean) {
    roomCode.value = code;
    playerId.value = id;
    isHost.value = host;
    connected.value = true;
    error.value = '';
  }

  function addPlayer(player: Player) {
    if (!players.value.find((p) => p.id === player.id)) {
      players.value.push(player);
    }
  }

  function removePlayer(id: string) {
    players.value = players.value.filter((p) => p.id !== id);
  }

  function setPlayers(list: Player[]) {
    players.value = list;
  }

  function setError(msg: string) {
    error.value = msg;
  }

  function updateSettings(newSettings: MatchSettings) {
    settings.value = newSettings;
  }

  function reset() {
    roomCode.value = '';
    playerId.value = '';
    isHost.value = false;
    players.value = [];
    connected.value = false;
    error.value = '';
    settings.value = { ...DEFAULT_MATCH_SETTINGS };
  }

  return {
    roomCode,
    playerId,
    nickname,
    isHost,
    players,
    connected,
    error,
    settings,
    playerCount,
    canStart,
    setRoom,
    addPlayer,
    removePlayer,
    setPlayers,
    setError,
    updateSettings,
    reset,
  };
});
