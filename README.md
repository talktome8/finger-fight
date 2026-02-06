# 🥊 Finger-Fight

**Fast, social tap-based party game.** Tap. Compete. Dominate.

A mobile-first multiplayer game designed for short sessions (3–6 minutes), played solo, vs CPU, same-device, or across multiple devices.

## 🎮 Game Modes

| Mode | Description | Network |
|------|-------------|---------|
| 🎯 Solo | Beat your personal high score | Offline |
| 🤖 vs CPU | Face Easy / Normal / Aggressive bots | Offline |
| 📱 Same Device | 2–4 players on one screen | Offline |
| 🌐 Online | Cross-device multiplayer via WebSocket rooms | Online |

## ⚡ Round Types

- **TAP FRENZY** 👆 — Every tap = 1 point. Go fast!
- **GOLDEN RUSH** ⭐ — Catch golden targets for 5× bonus
- **HOLD BACK** 🔄 — Fewer taps = higher score. Control yourself!
- **BULLSEYE** 🎯 — Only center taps count
- **KEEP COOL** ❄️ — Tap too fast and lose points
- **STEAL IT** 💰 — Your taps steal from opponents

## 🏗 Architecture

```
finger-fight/
├── shared/           # Framework-agnostic game core
│   └── src/
│       ├── types/    # TypeScript types & schemas
│       └── game-core/ # Scoring, CPU AI, Anti-cheat, Timers
├── server/           # Node.js WebSocket server
│   └── src/
│       ├── server.ts       # WebSocket handler
│       ├── room-manager.ts # Room lifecycle
│       └── game-engine.ts  # Authoritative game logic
└── client/           # Vue 3 + Vite PWA
    └── src/
        ├── components/  # Reusable UI (TapZone, TimerBar, etc.)
        ├── features/    # Screen-level views
        ├── stores/      # Pinia state management
        ├── network/     # WebSocket client
        └── styles/      # Global CSS
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Development
```bash
# Start both client and server
npm run dev

# Or individually:
npm run dev:client   # Vite dev server on http://localhost:5173
npm run dev:server   # WebSocket server on ws://localhost:3001
```

### Build
```bash
npm run build
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | Vue 3, TypeScript, Vite, Pinia |
| Server | Node.js, WebSocket (ws) |
| Shared | Framework-agnostic TypeScript |
| PWA | vite-plugin-pwa |

## 🛡 Security

- WSS support for production
- Server-authoritative scoring
- Anti-cheat tap validation
- Rate limiting on all messages
- No persistent user data
- Room codes expire after 30 minutes

## 📱 PWA Features

- Installable on mobile home screen
- Works offline (solo/CPU/local modes)
- Portrait orientation optimized
- Haptic feedback on supported devices
- Touch-optimized with multi-touch support

## 🎯 Design Principles

1. **Fun within 10 seconds** — No onboarding friction
2. **Modular rounds** — Each round type is a pluggable modifier
3. **Strict separation** — UI never contains game logic
4. **Future-proof** — Ready for daily challenges, leaderboards, skins
