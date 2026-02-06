import type { ClientMessage, ServerMessage } from '@finger-fight/shared';
import { useGameStore } from '@/stores/game';
import { useLobbyStore } from '@/stores/lobby';
import { ref } from 'vue';

export class NetworkClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Map<string, Set<(msg: ServerMessage) => void>> = new Map();

  isConnected = ref(false);
  latency = ref(0);

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected.value = true;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as ServerMessage;
            this.handleMessage(msg);
          } catch {
            console.error('Failed to parse server message');
          }
        };

        this.ws.onclose = () => {
          this.isConnected.value = false;
          this.attemptReconnect(url);
        };

        this.ws.onerror = () => {
          reject(new Error('WebSocket connection failed'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    this.ws?.close();
    this.ws = null;
    this.isConnected.value = false;
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(type: string, handler: (msg: ServerMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  private handleMessage(msg: ServerMessage): void {
    // Notify type-specific handlers
    const handlers = this.messageHandlers.get(msg.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(msg);
      }
    }

    // Notify wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        handler(msg);
      }
    }

    // Handle pong for latency
    if (msg.type === 'pong') {
      this.latency.value = Date.now() - msg.timestamp;
    }
  }

  private startPing(): void {
    setInterval(() => {
      if (this.isConnected.value) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 5000);
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    setTimeout(() => {
      this.connect(url).catch(() => {
        // Will retry via onclose
      });
    }, delay);
  }
}

// Singleton
let networkClient: NetworkClient | null = null;

export function useNetwork(): NetworkClient {
  if (!networkClient) {
    networkClient = new NetworkClient();
  }
  return networkClient;
}

// Setup message routing to stores
export function setupNetworkHandlers(network: NetworkClient): void {
  const lobby = useLobbyStore();
  const game = useGameStore();

  network.on('room-created', (msg) => {
    if (msg.type !== 'room-created') return;
    lobby.setRoom(msg.roomCode, msg.playerId, true);
    lobby.addPlayer(msg.player);
  });

  network.on('room-joined', (msg) => {
    if (msg.type !== 'room-joined') return;
    lobby.setRoom(msg.roomCode, msg.playerId, false);
    lobby.setPlayers(msg.players);
  });

  network.on('player-joined', (msg) => {
    if (msg.type !== 'player-joined') return;
    lobby.addPlayer(msg.player);
  });

  network.on('player-left', (msg) => {
    if (msg.type !== 'player-left') return;
    lobby.removePlayer(msg.playerId);
  });

  network.on('room-closed', () => {
    lobby.reset();
  });

  network.on('match-starting', (msg) => {
    if (msg.type !== 'match-starting') return;
    game.updatePhase('countdown');
  });

  network.on('round-intro', (msg) => {
    if (msg.type !== 'round-intro') return;
    game.setRoundConfig(msg.config);
    game.updatePhase('round-intro');
  });

  network.on('round-start', (msg) => {
    if (msg.type !== 'round-start') return;
    game.updatePhase('playing');
    game.startRound();
  });

  network.on('round-tick', (msg) => {
    if (msg.type !== 'round-tick') return;
    game.setTimeRemaining(msg.timeRemaining);
  });

  network.on('round-end', (msg) => {
    if (msg.type !== 'round-end') return;
    game.setScores(msg.scores);
    game.updatePhase('round-results');
  });

  network.on('match-end', (msg) => {
    if (msg.type !== 'match-end') return;
    game.setScores(msg.finalScores);
    game.updatePhase('final-podium');
  });

  network.on('settings-updated', (msg) => {
    if (msg.type !== 'settings-updated') return;
    lobby.updateSettings(msg.settings);
  });

  network.on('error', (msg) => {
    if (msg.type !== 'error') return;
    lobby.setError(msg.message);
  });
}
