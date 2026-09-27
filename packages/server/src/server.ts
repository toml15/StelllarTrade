import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './rooms/RoomManager.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

const roomManager = new RoomManager();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    roomManager.handleClientMessage(ws, data.toString());
  });

  ws.on('close', () => {
    roomManager.handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
    roomManager.handleDisconnect(ws);
  });
});

server.listen(Number(port), '0.0.0.0', () => {
  console.log(`[Stellartrade Server] Running on http://localhost:${port} and ws://localhost:${port}`);
});
