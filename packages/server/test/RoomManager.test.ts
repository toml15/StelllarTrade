import { describe, it, expect, vi } from 'vitest';
import { RoomManager } from '../src/rooms/RoomManager.js';
import { WebSocket } from 'ws';
import { BotAI } from '../src/bot/BotAI.js';

describe('RoomManager and Bot Integration', () => {
  it('creates rooms, handles bot player turns automatically', () => {
    const manager = new RoomManager();

    // Mock WebSocket
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    // Create room
    const { roomId, playerId } = manager.createRoom(mockWs, 'HostAlice');
    expect(roomId).toHaveLength(6);
    expect(playerId).toBeDefined();

    const room = (manager as any).rooms.get(roomId);
    expect(room).toBeDefined();

    // Add 2 bots so we have 3 players
    room.engine.dispatch(playerId, { type: 'ADD_BOT' });
    room.engine.dispatch(playerId, { type: 'ADD_BOT' });
    expect(room.engine.state.players).toHaveLength(3);

    // Host starts game (keep order for deterministic bot turn assertion)
    const startRes = room.engine.dispatch(playerId, { type: 'START_GAME', randomizeOrder: false });
    expect(startRes.success).toBe(true);
    expect(room.engine.state.phase).toBe('SETUP_ROUND_1');

    // Human player places settlement and road
    const allV = Array.from(room.engine.topology.vertexKeys);
    const v1 = allV[0];
    const e1 = room.engine.topology.vertexToEdges.get(v1)![0];

    room.engine.dispatch(playerId, { type: 'SETUP_BUILD_SETTLEMENT', vertexKey: v1 });
    room.engine.dispatch(playerId, { type: 'SETUP_BUILD_ROAD', edgeKey: e1 });

    // Active player is now Bot 1!
    const bot1 = room.engine.activePlayer!;
    expect(bot1.isBot).toBe(true);

    // Bot AI processes turn
    BotAI.processTurn(room.engine, bot1.id);

    // After Bot 1 placed settlement + road, active player should be Bot 2!
    const bot2 = room.engine.activePlayer!;
    expect(bot2.isBot).toBe(true);
    expect(bot2.id).not.toBe(bot1.id);
  });

  it('supports reconnection during active games by playerId or playerName', () => {
    const manager = new RoomManager();

    const mockWs1 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    // 1. Host creates room and starts game
    const { roomId, playerId } = manager.createRoom(mockWs1, 'Alice');
    const room = (manager as any).rooms.get(roomId);

    room.engine.dispatch(playerId, { type: 'ADD_BOT' });
    room.engine.dispatch(playerId, { type: 'ADD_BOT' });
    room.engine.dispatch(playerId, { type: 'START_GAME' });
    expect(room.engine.state.phase).toBe('SETUP_ROUND_1');

    // 2. Alice disconnects (e.g. closes tab / leaves)
    manager.handleDisconnect(mockWs1);

    const alice = room.engine.getPlayer(playerId)!;
    expect(alice.isConnected).toBe(false);
    // Room must NOT be deleted immediately!
    expect((manager as any).rooms.has(roomId)).toBe(true);

    // 3. Alice reconnects with new WebSocket and matching playerId
    const mockWs2 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    const rejoinSuccess = manager.joinRoom(mockWs2, roomId, 'Alice', playerId);
    expect(rejoinSuccess).toBe(true);
    expect(alice.isConnected).toBe(true);
    expect(room.clients.get(playerId)).toBe(mockWs2);

    // 4. Test disconnect and reconnect by player name (if playerId is lost)
    manager.handleDisconnect(mockWs2);
    expect(alice.isConnected).toBe(false);

    const mockWs3 = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    // Joins with room code and name 'Alice' without providing playerId
    const rejoinByName = manager.joinRoom(mockWs3, roomId, 'Alice');
    expect(rejoinByName).toBe(true);
    expect(alice.isConnected).toBe(true);
    expect(room.clients.get(playerId)).toBe(mockWs3);
  });
});
