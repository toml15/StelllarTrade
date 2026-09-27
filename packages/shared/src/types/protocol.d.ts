import { GameAction } from './actions.js';
import { GameState, GameSettings } from './game.js';
export type ClientMessage = {
    type: 'CREATE_ROOM';
    hostName: string;
    settings?: Partial<GameSettings>;
} | {
    type: 'JOIN_ROOM';
    roomId: string;
    playerName: string;
    playerId?: string;
} | {
    type: 'DISPATCH_ACTION';
    action: GameAction;
} | {
    type: 'LEAVE_ROOM';
} | {
    type: 'PING';
};
export type ServerMessage = {
    type: 'ROOM_CREATED';
    roomId: string;
    playerId: string;
    state: GameState;
} | {
    type: 'ROOM_JOINED';
    roomId: string;
    playerId: string;
    state: GameState;
} | {
    type: 'STATE_UPDATE';
    state: GameState;
} | {
    type: 'ACTION_RESULT';
    success: boolean;
    error?: string;
} | {
    type: 'ERROR';
    message: string;
} | {
    type: 'PONG';
};
//# sourceMappingURL=protocol.d.ts.map