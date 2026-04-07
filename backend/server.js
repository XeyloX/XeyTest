import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import { buildApp } from './app.js';
import { initDb } from './db/index.js';
import { StreamHub } from './socket/streamHub.js';

const port = Number(process.env.PORT || 4000);

async function start() {
  await initDb();
  const app = buildApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
  });
  const streamHub = new StreamHub(io);
  streamHub.bind();
  app.locals.streamHub = streamHub;

  server.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  const shutdown = () => {
    io.close(() => server.close(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err);
  });
  process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection', err);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
