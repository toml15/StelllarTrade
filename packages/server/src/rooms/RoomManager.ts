import { WebSocket } from 'ws';
import { GameEngine } from '../engine/GameEngine.js';
import { BotAI } from '../bot/BotAI.js';
import { ClientMessage, ServerMessage } from '../network/protocol.js';
import { GameAction, GameSettings } from '@stellartrade/shared';

export interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

export interface GameRoom {
  roomId: string;
  engine: GameEngine;
  clients: Map<string, WebSocket>; // playerId -> ws
  botTimer: NodeJS.Timeout | null;
  emptyRoomTimer: NodeJS.Timeout | null;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private clientToRoom: Map<WebSocket, ConnectedClient> = new Map();

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(
    ws: WebSocket,
    hostName: string,
    settings?: Partial<GameSettings>
  ): { roomId: string; playerId: string } {
    const roomId = this.generateRoomCode();
    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const engine = new GameEngine(roomId, playerId, settings);
    engine.addPlayer(playerId, hostName);

    const room: GameRoom = {
      roomId,
      engine,
      clients: new Map([[playerId, ws]]),
      botTimer: null,
      emptyRoomTimer: null,
    };

    this.rooms.set(roomId, room);
    this.clientToRoom.set(ws, { ws, playerId, roomId });

    this.send(ws, {
      type: 'ROOM_CREATED',
      roomId,
      playerId,
      state: engine.state,
    });

    return { roomId, playerId };
  }

  public joinRoom(
    ws: WebSocket,
    roomId: string,
    playerName: string,
    existingPlayerId?: string
  ): boolean {
    const upperRoomId = roomId.toUpperCase();
    const room = this.rooms.get(upperRoomId);
    if (!room) {
      this.send(ws, { type: 'ERROR', message: `Sector "${roomId}" not found or expired.` });
      return false;
    }

    if (room.emptyRoomTimer) {
      clearTimeout(room.emptyRoomTimer);
      room.emptyRoomTimer = null;
    }

    // 1. Check if reconnecting by existingPlayerId
    let targetPlayer = existingPlayerId ? room.engine.getPlayer(existingPlayerId) : undefined;

    // 2. If not found by playerId, match by playerName among disconnected human players
    if (!targetPlayer && playerName) {
      const trimmedName = playerName.trim().toLowerCase();
      targetPlayer = room.engine.state.players.find(
        (p) => !p.isBot && !p.isConnected && p.name.trim().toLowerCase() === trimmedName
      );
    }

    // Reconnecting to existing player seat
    if (targetPlayer) {
      targetPlayer.isConnected = true;
      const playerId = targetPlayer.id;

      room.clients.set(playerId, ws);
      this.clientToRoom.set(ws, { ws, playerId, roomId: upperRoomId });

      this.send(ws, {
        type: 'ROOM_JOINED',
        roomId: upperRoomId,
        playerId,
        state: room.engine.state,
      });

      this.broadcastState(room);
      this.scheduleBotTurns(room);
      return true;
    }

    // 3. If game is already running (phase !== 'LOBBY')
    if (room.engine.state.phase !== 'LOBBY') {
      const disconnectedSeats = room.engine.state.players.filter((p) => !p.isBot && !p.isConnected);
      if (disconnectedSeats.length === 1) {
        const seat = disconnectedSeats[0];
        seat.isConnected = true;
        if (playerName && playerName.trim()) {
          seat.name = playerName.trim();
        }
        const playerId = seat.id;

        room.clients.set(playerId, ws);
        this.clientToRoom.set(ws, { ws, playerId, roomId: upperRoomId });

        this.send(ws, {
          type: 'ROOM_JOINED',
          roomId: upperRoomId,
          playerId,
          state: room.engine.state,
        });

        this.broadcastState(room);
        this.scheduleBotTurns(room);
        return true;
      }

      this.send(ws, {
        type: 'ERROR',
        message: 'Mission is already underway. No disconnected commander slot found for you.',
      });
      return false;
    }

    // 4. Normal new player join in LOBBY phase
    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const joinRes = room.engine.addPlayer(playerId, playerName);
    if (!joinRes.success) {
      this.send(ws, { type: 'ERROR', message: joinRes.error || 'Failed to join sector.' });
      return false;
    }

    room.clients.set(playerId, ws);
    this.clientToRoom.set(ws, { ws, playerId, roomId: upperRoomId });

    this.send(ws, {
      type: 'ROOM_JOINED',
      roomId: upperRoomId,
      playerId,
      state: room.engine.state,
    });

    this.broadcastState(room);
    return true;
  }

  public handleClientMessage(ws: WebSocket, data: string): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data);
    } catch {
      this.send(ws, { type: 'ERROR', message: 'Invalid JSON payload.' });
      return;
    }

    if (msg.type === 'PING') {
      this.send(ws, { type: 'PONG' });
      return;
    }

    if (msg.type === 'CREATE_ROOM') {
      this.createRoom(ws, msg.hostName, msg.settings);
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      this.joinRoom(ws, msg.roomId, msg.playerName, msg.playerId);
      return;
    }

    const clientInfo = this.clientToRoom.get(ws);
    if (!clientInfo) {
      this.send(ws, { type: 'ERROR', message: 'You are not connected to any sector room.' });
      return;
    }

    const room = this.rooms.get(clientInfo.roomId);
    if (!room) return;

    if (msg.type === 'LEAVE_ROOM') {
      this.handleDisconnect(ws);
      return;
    }

    if (msg.type === 'DISPATCH_ACTION') {
      this.handleAction(room, clientInfo.playerId, msg.action, ws);
    }
  }

  public handleAction(
    room: GameRoom,
    playerId: string,
    action: GameAction,
    ws?: WebSocket
  ): void {
    const res = room.engine.dispatch(playerId, action);

    if (ws) {
      this.send(ws, {
        type: 'ACTION_RESULT',
        success: res.success,
        error: res.error,
      });
    }

    if (res.success) {
      this.broadcastState(room);
      this.scheduleBotTurns(room);
    }
  }

  public scheduleBotTurns(room: GameRoom): void {
    if (room.botTimer) {
      clearTimeout(room.botTimer);
      room.botTimer = null;
    }

    if (room.engine.state.phase === 'LOBBY' || room.engine.state.phase === 'GAME_OVER') {
      return;
    }

    // Check if any bot needs to discard
    const discardingBotId = room.engine.state.discardingPlayerIds.find((id) => {
      const p = room.engine.getPlayer(id);
      return p && p.isBot;
    });

    if (discardingBotId) {
      room.botTimer = setTimeout(() => {
        BotAI.processTurn(room.engine, discardingBotId);
        this.broadcastState(room);
        this.scheduleBotTurns(room);
      }, 500);
      return;
    }

    // Check if there is an active trade offer pending bot responses
    if (room.engine.state.activeTradeOffer) {
      const offer = room.engine.state.activeTradeOffer;
      const unrespondedBot = room.engine.state.players.find(
        (p) =>
          p.isBot &&
          p.id !== offer.senderPlayerId &&
          !offer.acceptedBy.includes(p.id) &&
          !offer.declinedBy.includes(p.id) &&
          (!offer.targetPlayerId || offer.targetPlayerId === p.id)
      );

      if (unrespondedBot) {
        room.botTimer = setTimeout(() => {
          BotAI.handleTradeOfferResponse(room.engine, unrespondedBot.id);
          this.broadcastState(room);
          this.scheduleBotTurns(room);
        }, 1200);
        return;
      }
    }

    // Check if active player is a bot
    const active = room.engine.activePlayer;
    if (active && active.isBot) {
      room.botTimer = setTimeout(() => {
        BotAI.processTurn(room.engine, active.id);
        this.broadcastState(room);
        this.scheduleBotTurns(room);
      }, 800);
    }
  }

  public handleDisconnect(ws: WebSocket): void {
    const clientInfo = this.clientToRoom.get(ws);
    if (!clientInfo) return;

    this.clientToRoom.delete(ws);
    const room = this.rooms.get(clientInfo.roomId);
    if (!room) return;

    room.clients.delete(clientInfo.playerId);

    const player = room.engine.getPlayer(clientInfo.playerId);
    if (player) {
      player.isConnected = false;
    }

    if (room.engine.state.phase === 'LOBBY') {
      room.engine.removePlayer(clientInfo.playerId);
      const anyHuman = room.engine.state.players.some((p) => !p.isBot);
      if (!anyHuman) {
        if (room.botTimer) clearTimeout(room.botTimer);
        if (room.emptyRoomTimer) clearTimeout(room.emptyRoomTimer);
        this.rooms.delete(clientInfo.roomId);
        return;
      }
      this.broadcastState(room);
      return;
    }

    // Active game is running: check if any humans are still connected
    const anyConnected = room.engine.state.players.some((p) => !p.isBot && p.isConnected);
    if (!anyConnected) {
      if (room.botTimer) {
        clearTimeout(room.botTimer);
        room.botTimer = null;
      }
      // Give 30-minute grace period before cleaning up empty ongoing game
      if (!room.emptyRoomTimer) {
        room.emptyRoomTimer = setTimeout(() => {
          this.rooms.delete(clientInfo.roomId);
        }, 30 * 60 * 1000);
      }
    } else {
      this.broadcastState(room);
    }
  }

  private broadcastState(room: GameRoom): void {
    const payload: ServerMessage = {
      type: 'STATE_UPDATE',
      state: room.engine.state,
    };
    const json = JSON.stringify(payload);

    for (const [, clientWs] of room.clients.entries()) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(json);
      }
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }
}
