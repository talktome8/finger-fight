import { GameServer } from './server.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = new GameServer(PORT);

console.log(`
╔══════════════════════════════════════╗
║     🥊 FINGER-FIGHT SERVER 🥊       ║
║                                      ║
║   WebSocket running on port ${PORT}    ║
║   Ready for connections...           ║
╚══════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});
