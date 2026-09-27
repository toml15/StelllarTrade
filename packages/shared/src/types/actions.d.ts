import { HexCoord } from './hex.js';
import { ResourceCount, ResourceType } from './resource.js';
import { PlayerColor } from './player.js';
export interface TradeOffer {
    id: string;
    senderPlayerId: string;
    targetPlayerId?: string;
    give: Partial<ResourceCount>;
    want: Partial<ResourceCount>;
    acceptedBy: string[];
    declinedBy: string[];
}
export type GameAction = {
    type: 'SET_PLAYER_PROFILE';
    name: string;
    color: PlayerColor;
} | {
    type: 'TOGGLE_READY';
} | {
    type: 'UPDATE_SETTINGS';
    settings: Partial<import('./game.js').GameSettings>;
} | {
    type: 'ADD_BOT';
    color?: PlayerColor;
} | {
    type: 'REMOVE_BOT';
    botId: string;
} | {
    type: 'START_GAME';
    randomizeOrder?: boolean;
} | {
    type: 'PLACE_DRAFT_TILE';
    coord: HexCoord;
} | {
    type: 'SETUP_BUILD_OUTPOST';
    vertexKey: string;
} | {
    type: 'SETUP_BUILD_SETTLEMENT';
    vertexKey: string;
} | {
    type: 'SETUP_BUILD_HYPERLANE';
    edgeKey: string;
} | {
    type: 'SETUP_BUILD_ROAD';
    edgeKey: string;
} | {
    type: 'ROLL_DICE';
} | {
    type: 'BUILD_HYPERLANE';
    edgeKey: string;
} | {
    type: 'BUILD_ROAD';
    edgeKey: string;
} | {
    type: 'BUILD_OUTPOST';
    vertexKey: string;
} | {
    type: 'BUILD_SETTLEMENT';
    vertexKey: string;
} | {
    type: 'BUILD_STARBASE';
    vertexKey: string;
} | {
    type: 'BUILD_CITY';
    vertexKey: string;
} | {
    type: 'BUY_TECH_MODULE';
} | {
    type: 'BUY_DEV_CARD';
} | {
    type: 'PLAY_TECH_MODULE';
    cardId: string;
    params?: {
        corsairTarget?: HexCoord;
        robberTarget?: HexCoord;
        stealVictimId?: string;
        lane1EdgeKey?: string;
        road1EdgeKey?: string;
        lane2EdgeKey?: string;
        road2EdgeKey?: string;
        synthesisResources?: [ResourceType, ResourceType];
        yearOfPlentyResources?: [ResourceType, ResourceType];
        embargoResource?: ResourceType;
        monopolyResource?: ResourceType;
    };
} | {
    type: 'PLAY_DEV_CARD';
    cardId: string;
    params?: {
        corsairTarget?: HexCoord;
        robberTarget?: HexCoord;
        stealVictimId?: string;
        lane1EdgeKey?: string;
        road1EdgeKey?: string;
        lane2EdgeKey?: string;
        road2EdgeKey?: string;
        synthesisResources?: [ResourceType, ResourceType];
        yearOfPlentyResources?: [ResourceType, ResourceType];
        embargoResource?: ResourceType;
        monopolyResource?: ResourceType;
    };
} | {
    type: 'CREATE_TRADE_OFFER';
    give: Partial<ResourceCount>;
    want: Partial<ResourceCount>;
    targetPlayerId?: string;
} | {
    type: 'RESPOND_TRADE_OFFER';
    offerId: string;
    accept: boolean;
} | {
    type: 'EXECUTE_TRADE';
    offerId: string;
    acceptedPlayerId: string;
} | {
    type: 'CANCEL_TRADE_OFFER';
    offerId: string;
} | {
    type: 'DEPOT_TRADE';
    giveResource?: ResourceType;
    giveResources?: Partial<ResourceCount>;
    receiveResource: ResourceType;
    count: number;
} | {
    type: 'BANK_TRADE';
    giveResource?: ResourceType;
    giveResources?: Partial<ResourceCount>;
    receiveResource: ResourceType;
    count: number;
} | {
    type: 'DISCARD_RESOURCES';
    resources: Partial<ResourceCount>;
} | {
    type: 'DISCARD_CARDS';
    resources: Partial<ResourceCount>;
} | {
    type: 'MOVE_VOID_CORSAIR';
    coord: HexCoord;
    victimPlayerId?: string;
} | {
    type: 'MOVE_ROBBER';
    coord: HexCoord;
    victimPlayerId?: string;
} | {
    type: 'STEAL_RESOURCE';
    victimPlayerId: string;
} | {
    type: 'END_TURN';
};
//# sourceMappingURL=actions.d.ts.map