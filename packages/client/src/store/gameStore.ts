import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameAction, ClientMessage, ServerMessage } from '@stellartrade/shared';
import { sounds } from '../audio/soundEngine.js';

export interface UseGameReturn {
  state: GameState | null;
  playerId: string | null;
  roomId: string | null;
  error: string | null;
  isConnected: boolean;
  createRoom: (hostName: string, settings?: any) => void;
  joinRoom: (roomId: string, playerName: string, preferredPlayerId?: string) => void;
  dispatchAction: (action: GameAction) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

export function useGame(): UseGameReturn {
  const [state, setState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem('stellartrade_playerId'));
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('stellartrade_roomId'));
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const prevStateRef = useRef<GameState | null>(null);
  const pendingQueueRef = useRef<ClientMessage[]>([]);
  const isConnectingRef = useRef<boolean>(false);

  const getWsUrl = useCallback(() => {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = loc.hostname || 'localhost';

    if (loc.port === '3000') {
      return `${protocol}//${host}:4000`;
    }
    return `${protocol}//${loc.host}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isConnectingRef.current = true;
    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      isConnectingRef.current = false;
      setIsConnected(true);
      setError(null);

      while (pendingQueueRef.current.length > 0) {
        const pendingMsg = pendingQueueRef.current.shift();
        if (pendingMsg) {
          ws.send(JSON.stringify(pendingMsg));
        }
      }

      const storedRoom = localStorage.getItem('stellartrade_roomId');
      const storedPlayer = localStorage.getItem('stellartrade_playerId');
      const storedName = localStorage.getItem('stellartrade_playerName') || 'Commander';

      if (storedRoom && storedPlayer && !state) {
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomId: storedRoom,
            playerName: storedName,
            playerId: storedPlayer,
          } as ClientMessage)
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'ROOM_CREATED':
          case 'ROOM_JOINED':
            setRoomId(msg.roomId);
            setPlayerId(msg.playerId);
            setState(msg.state);
            localStorage.setItem('stellartrade_roomId', msg.roomId);
            localStorage.setItem('stellartrade_playerId', msg.playerId);
            localStorage.setItem('stellartrade_lastRoomId', msg.roomId);
            localStorage.setItem('stellartrade_lastPlayerId', msg.playerId);
            setError(null);
            break;

          case 'STATE_UPDATE': {
            const prevState = prevStateRef.current;
            prevStateRef.current = msg.state;

            if (prevState) {
              if (
                msg.state.currentDice &&
                (!prevState.currentDice ||
                  prevState.diceHistory.length !== msg.state.diceHistory.length)
              ) {
                sounds.playDiceRoll();
              }
              const prevBuildingsCount = Object.keys(prevState.buildings).length;
              const nextBuildingsCount = Object.keys(msg.state.buildings).length;
              const prevRoadsCount = Object.keys(prevState.roads).length;
              const nextRoadsCount = Object.keys(msg.state.roads).length;

              if (nextBuildingsCount > prevBuildingsCount || nextRoadsCount > prevRoadsCount) {
                sounds.playBuild();
              }

              if (msg.state.phase === 'GAME_OVER' && prevState.phase !== 'GAME_OVER') {
                sounds.playVictory();
              }
            }

            setState(msg.state);
            break;
          }

          case 'ACTION_RESULT':
            if (!msg.success && msg.error) {
              setError(msg.error);
            }
            break;

          case 'ERROR':
            setError(msg.message);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing server message', err);
      }
    };

    ws.onclose = () => {
      isConnectingRef.current = false;
      setIsConnected(false);
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      }, 1000);
    };

    ws.onerror = () => {
      isConnectingRef.current = false;
    };
  }, [getWsUrl, state]);

  useEffect(() => {
    connect();
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 10000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [connect]);

  const send = (msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      pendingQueueRef.current.push(msg);
      connect();
    }
  };

  const createRoom = (hostName: string, settings?: any) => {
    localStorage.setItem('stellartrade_playerName', hostName);
    send({ type: 'CREATE_ROOM', hostName, settings });
  };

  const joinRoom = (room: string, playerName: string, preferredPlayerId?: string) => {
    localStorage.setItem('stellartrade_playerName', playerName);
    const upperRoom = room.trim().toUpperCase();
    const existingPlayerId =
      preferredPlayerId ||
      (localStorage.getItem('stellartrade_roomId') === upperRoom
        ? localStorage.getItem('stellartrade_playerId')
        : null) ||
      (localStorage.getItem('stellartrade_lastRoomId') === upperRoom
        ? localStorage.getItem('stellartrade_lastPlayerId')
        : null) ||
      undefined;

    send({
      type: 'JOIN_ROOM',
      roomId: upperRoom,
      playerName,
      playerId: existingPlayerId,
    });
  };

  const dispatchAction = (action: GameAction) => {
    setError(null);
    send({ type: 'DISPATCH_ACTION', action });
  };

  const leaveRoom = () => {
    send({ type: 'LEAVE_ROOM' });
    const curRoom = roomId || localStorage.getItem('stellartrade_roomId');
    const curPlayer = playerId || localStorage.getItem('stellartrade_playerId');
    if (curRoom && curPlayer) {
      localStorage.setItem('stellartrade_lastRoomId', curRoom);
      localStorage.setItem('stellartrade_lastPlayerId', curPlayer);
    }
    localStorage.removeItem('stellartrade_roomId');
    localStorage.removeItem('stellartrade_playerId');
    setRoomId(null);
    setPlayerId(null);
    setState(null);
  };

  return {
    state,
    playerId,
    roomId,
    error,
    isConnected,
    createRoom,
    joinRoom,
    dispatchAction,
    leaveRoom,
    clearError: () => setError(null),
  };
}
