import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuid } from 'uuid';
import { RoomManager, type GameRoom, type RoomPlayer } from './room-manager.js';
import { GameEngine } from './game-engine.js';
import type {
  ClientMessage,
  ServerMessage,
  Player,
  MatchSettings,
} from '@finger-fight/shared';
import { RateLimiter } from '@finger-fight/shared';

interface ClientSocket extends WebSocket {
  playerId?: string;
  isAlive?: boolean;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

export class GameServer {
  private wss: WebSocketServer;
  private rooms: RoomManager;
  private engines: Map<string, GameEngine> = new Map();
  private rateLimiter = new RateLimiter();

  constructor(port: number) {
    this.rooms = new RoomManager();

    // Try to find client dist folder (works both in dev and production layouts)
    const possiblePaths = [
      join(process.cwd(), 'client-dist'),       // Production: copied next to server
      join(process.cwd(), '..', 'client', 'dist'), // Dev: monorepo structure
    ];
    const clientDist = possiblePaths.find((p) => existsSync(join(p, 'index.html'))) || '';
    const hasClientBuild = clientDist !== '';

    const httpServer = createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (req.url === '/api/health') {
        const stats = this.rooms.getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', ...stats }));
        return;
      }

      // Serve static client files
      if (hasClientBuild) {
        let urlPath = (req.url || '/').split('?')[0];
        if (urlPath === '/') urlPath = '/index.html';

        const fullPath = join(clientDist, urlPath);

        // Security: prevent directory traversal
        if (fullPath.startsWith(clientDist) && existsSync(fullPath) && statSync(fullPath).isFile()) {
          const ext = extname(fullPath);
          const mime = MIME_TYPES[ext] || 'application/octet-stream';
          const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
          res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cacheControl });
          res.end(readFileSync(fullPath));
          return;
        }

        // SPA fallback — serve index.html for non-file routes
        if (!extname(urlPath)) {
          const indexPath = join(clientDist, 'index.html');
          res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
          res.end(readFileSync(indexPath));
          return;
        }
      }

      // Fallback landing page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>🥊 Finger-Fight Server</h1><p>WebSocket server is running.</p></div></body></html>`);
    });

    this.wss = new WebSocketServer({ server: httpServer });

    httpServer.listen(port, () => {
      console.log(`🎮 Finger-Fight server running on port ${port}`);
      if (hasClientBuild) console.log(`📱 Serving client from ${clientDist}`);
    });

    this.wss.on('connection', (ws: ClientSocket) => {
      ws.playerId = uuid();
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as ClientMessage;
          this.handleMessage(ws, message);
        } catch {
          this.send(ws, {
            type: 'error',
            code: 'INVALID_MESSAGE',
            message: 'Invalid message format',
          });
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });

    // Heartbeat
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as ClientSocket;
        if (!client.isAlive) {
          this.handleDisconnect(client);
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    // Room cleanup
    setInterval(() => {
      const cleaned = this.rooms.cleanup();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired rooms`);
      }
    }, 60000);
  }

  private handleMessage(ws: ClientSocket, msg: ClientMessage): void {
    const playerId = ws.playerId!;

    // Rate limit
    if (!this.rateLimiter.check(playerId, 60, 1000)) {
      this.send(ws, {
        type: 'error',
        code: 'RATE_LIMITED',
        message: 'Too many messages',
      });
      return;
    }

    switch (msg.type) {
      case 'create-room':
        this.handleCreateRoom(ws, msg.nickname);
        break;

      case 'join-room':
        this.handleJoinRoom(ws, msg.roomCode, msg.nickname);
        break;

      case 'leave-room':
        this.handleDisconnect(ws);
        break;

      case 'start-match':
        this.handleStartMatch(ws);
        break;

      case 'tap-data':
        this.handleTapData(ws, msg.payload);
        break;

      case 'ready':
        this.handleReady(ws);
        break;

      case 'ping':
        this.send(ws, {
          type: 'pong',
          timestamp: msg.timestamp,
          serverTime: Date.now(),
        });
        break;

      case 'update-settings':
        this.handleUpdateSettings(ws, msg.settings);
        break;
    }
  }

  private handleCreateRoom(ws: ClientSocket, nickname: string): void {
    if (!this.validateNickname(nickname)) {
      this.send(ws, {
        type: 'error',
        code: 'INVALID_NICKNAME',
        message: 'Nickname must be 1-12 characters',
      });
      return;
    }

    const room = this.rooms.createRoom(
      {
        id: ws.playerId!,
        nickname,
        isCPU: false,
        deviceId: ws.playerId!,
        connected: true,
      },
      ws
    );

    const player = room.players.get(ws.playerId!)!.player;

    this.send(ws, {
      type: 'room-created',
      roomCode: room.code,
      playerId: ws.playerId!,
      player,
    });

    console.log(`📦 Room ${room.code} created by ${nickname}`);
  }

  private handleJoinRoom(ws: ClientSocket, code: string, nickname: string): void {
    if (!this.validateNickname(nickname)) {
      this.send(ws, {
        type: 'error',
        code: 'INVALID_NICKNAME',
        message: 'Nickname must be 1-12 characters',
      });
      return;
    }

    const result = this.rooms.joinRoom(
      code,
      {
        id: ws.playerId!,
        nickname,
        isCPU: false,
        deviceId: ws.playerId!,
        connected: true,
      },
      ws
    );

    if ('error' in result) {
      this.send(ws, {
        type: 'error',
        code: result.error,
        message: `Cannot join room: ${result.error}`,
      });
      return;
    }

    const { room, player } = result;
    const players = [...room.players.values()].map((rp) => rp.player);

    // Tell the joiner
    this.send(ws, {
      type: 'room-joined',
      roomCode: room.code,
      playerId: ws.playerId!,
      player,
      players,
    });

    // Tell everyone else
    this.broadcastToRoom(room, {
      type: 'player-joined',
      player,
    }, ws.playerId);

    console.log(`👤 ${nickname} joined room ${room.code}`);
  }

  private handleStartMatch(ws: ClientSocket): void {
    const room = this.rooms.getRoomByPlayer(ws.playerId!);
    if (!room) return;

    if (room.hostId !== ws.playerId) {
      this.send(ws, {
        type: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can start the match',
      });
      return;
    }

    if (room.players.size < 1) return; // Should never happen

    const engine = new GameEngine(room, (msg, excludeId) => {
      this.broadcastToRoom(room, msg, excludeId);
    });

    this.engines.set(room.id, engine);
    room.state = 'playing';

    engine.startMatch();
    console.log(`🎯 Match started in room ${room.code}`);
  }

  private handleTapData(ws: ClientSocket, payload: any): void {
    const room = this.rooms.getRoomByPlayer(ws.playerId!);
    if (!room) return;

    const engine = this.engines.get(room.id);
    if (!engine) return;

    engine.receiveTapData(ws.playerId!, payload);
  }

  private handleReady(ws: ClientSocket): void {
    const room = this.rooms.getRoomByPlayer(ws.playerId!);
    if (!room) return;

    const rp = room.players.get(ws.playerId!);
    if (rp) rp.ready = true;
  }

  private handleUpdateSettings(
    ws: ClientSocket,
    settings: Partial<MatchSettings>
  ): void {
    const room = this.rooms.getRoomByPlayer(ws.playerId!);
    if (!room) return;

    if (room.hostId !== ws.playerId) {
      this.send(ws, {
        type: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can update settings',
      });
      return;
    }

    Object.assign(room.settings, settings);

    this.broadcastToRoom(room, {
      type: 'settings-updated',
      settings: room.settings,
    });
  }

  private handleDisconnect(ws: ClientSocket): void {
    if (!ws.playerId) return;

    const result = this.rooms.removePlayer(ws.playerId);
    if (!result) return;

    const { room, wasHost } = result;

    if (room.players.size === 0) {
      // Room destroyed
      const engine = this.engines.get(room.id);
      if (engine) {
        engine.stop();
        this.engines.delete(room.id);
      }
    } else {
      this.broadcastToRoom(room, {
        type: 'player-left',
        playerId: ws.playerId,
      });
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private broadcastToRoom(
    room: GameRoom,
    msg: ServerMessage,
    excludePlayerId?: string
  ): void {
    for (const [id, rp] of room.players) {
      if (id === excludePlayerId) continue;
      const ws = rp.ws as WebSocket;
      this.send(ws, msg);
    }
  }

  private validateNickname(name: string): boolean {
    return (
      typeof name === 'string' &&
      name.trim().length >= 1 &&
      name.trim().length <= 12
    );
  }
}
