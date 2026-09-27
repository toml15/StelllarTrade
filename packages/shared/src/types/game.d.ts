import { HexTile, HexCoord } from './hex.js';
import { Harbor } from './harbor.js';
import { Building, Hyperlane } from './building.js';
import { Player } from './player.js';
import { TechModuleType } from './cards.js';
import { TradeOffer } from './actions.js';
import { ResourceCount } from './resource.js';
export type GamePhase = 'LOBBY' | 'BOARD_DRAFT' | 'SETUP_ROUND_1' | 'SETUP_ROUND_2' | 'ROLL_DICE' | 'CORSAIR_DISCARD' | 'ROBBER_DISCARD' | 'CORSAIR_MOVE' | 'ROBBER_MOVE' | 'CORSAIR_STEAL' | 'ROBBER_STEAL' | 'MAIN_TURN' | 'EXTRAORDINARY_BUILD' | 'GAME_OVER';
export interface GameSettings {
    maxPlayers: number;
    victoryPointsToWin: number;
    turnTimerSeconds: number;
    randomBoard: boolean;
    boardDraft: boolean;
    friendlyDesert: boolean;
    robberProtectedRounds: number;
    seafarersEnabled: boolean;
    citiesAndKnightsEnabled: boolean;
}
export interface DiceRoll {
    die1: number;
    die2: number;
    sum: number;
}
export interface ProductionNotice {
    roll: number;
    distributions: Record<string, Partial<ResourceCount>>;
    blockedTiles: HexCoord[];
    producingTiles: HexCoord[];
    timestamp: number;
}
export interface TechModuleNotice {
    playerId: string;
    cardType: TechModuleType;
    description: string;
    timestamp: number;
}
export type DevCardNotice = TechModuleNotice;
export interface GameState {
    roomId: string;
    hostPlayerId: string;
    phase: GamePhase;
    settings: GameSettings;
    players: Player[];
    activePlayerIndex: number;
    turnNumber: number;
    tiles: HexTile[];
    harbors: Harbor[];
    robberCoord: HexCoord;
    corsairCoord?: HexCoord;
    buildings: Record<string, Building>;
    roads: Record<string, Hyperlane>;
    draftPool?: HexTile[];
    currentDraftTile?: HexTile | null;
    devCardDeck: TechModuleType[];
    currentDice: DiceRoll | null;
    diceHistory: DiceRoll[];
    lastProduction?: ProductionNotice | null;
    playedDevCardThisTurn: boolean;
    freeRoadsRemaining: number;
    discardingPlayerIds: string[];
    robberVictimCandidates?: string[];
    lastDevCardNotice?: TechModuleNotice | null;
    activeTradeOffer: TradeOffer | null;
    longestRoadHolderId: string | null;
    longestRoadLength: number;
    largestArmyHolderId: string | null;
    largestArmySize: number;
    winnerPlayerId: string | null;
}
//# sourceMappingURL=game.d.ts.map