import { HexTile, HexCoord } from './hex.js';
import { Harbor } from './harbor.js';
import { Building, Hyperlane } from './building.js';
import { Player } from './player.js';
import { TechModuleType } from './cards.js';
import { TradeOffer } from './actions.js';
import { ResourceCount } from './resource.js';

export type GamePhase =
  | 'LOBBY'
  | 'BOARD_DRAFT'          // Interactive planet-placement drafting
  | 'SETUP_ROUND_1'        // Outpost 1 + Hyperlane 1 in forward order
  | 'SETUP_ROUND_2'        // Outpost 2 + Hyperlane 2 in reverse order + starting resources
  | 'ROLL_DICE'            // Cycle start: can deploy patrol frigate or roll dice
  | 'CORSAIR_DISCARD'      // Active when 7 rolled and some fleets have > 7 cargo cards
  | 'ROBBER_DISCARD'       // Compatibility alias
  | 'CORSAIR_MOVE'         // Active commander repositions Void Corsair
  | 'ROBBER_MOVE'          // Compatibility alias
  | 'CORSAIR_STEAL'        // Active commander selects rival outpost to raid
  | 'ROBBER_STEAL'         // Compatibility alias
  | 'MAIN_TURN'            // Main phase: trade, construct, deploy tech modules, end cycle
  | 'EXTRAORDINARY_BUILD'  // 5-6 player special build phase
  | 'GAME_OVER';

export interface GameSettings {
  maxPlayers: number;             // 3-4 (base) or 5-6 (extension)
  victoryPointsToWin: number;     // Standard 10 Influence Points
  turnTimerSeconds: number;       // 0 for unlimited, 30, 60, 90
  randomBoard: boolean;           // Standard fixed or randomized
  boardDraft: boolean;            // Interactive tile-placement drafting
  friendlyDesert: boolean;        // House rule: Dead World grants 1 resource on 7
  robberProtectedRounds: number;  // 0, 1 or 2 rounds Void Corsair inactive on 7
  seafarersEnabled: boolean;      // Module toggle
  citiesAndKnightsEnabled: boolean;// Module toggle
}

export interface DiceRoll {
  die1: number;
  die2: number;
  sum: number;
}

export interface ProductionNotice {
  roll: number;
  distributions: Record<string, Partial<ResourceCount>>; // playerId -> { [resource]: count }
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

  // Board
  tiles: HexTile[];
  harbors: Harbor[];
  robberCoord: HexCoord; // Coordinates of the Void Corsair
  corsairCoord?: HexCoord;

  // Placed pieces (keyed by canonical hash)
  buildings: Record<string, Building>; // vertexKey -> Outpost or Starbase
  roads: Record<string, Hyperlane>;    // edgeKey -> Hyperlane

  // Interactive Board Draft (when phase === 'BOARD_DRAFT')
  draftPool?: HexTile[];
  currentDraftTile?: HexTile | null;

  // Deck of Tech Modules
  devCardDeck: TechModuleType[];

  // Dice
  currentDice: DiceRoll | null;
  diceHistory: DiceRoll[];
  lastProduction?: ProductionNotice | null;

  // Turn state & locks
  playedDevCardThisTurn: boolean;
  freeRoadsRemaining: number;
  discardingPlayerIds: string[]; // Players who still need to discard on a 7
  robberVictimCandidates?: string[];
  lastDevCardNotice?: TechModuleNotice | null;

  // Trading
  activeTradeOffer: TradeOffer | null;

  // Longest Trade Route & Fleet Supremacy
  longestRoadHolderId: string | null;
  longestRoadLength: number;
  largestArmyHolderId: string | null;
  largestArmySize: number;

  winnerPlayerId: string | null;
}
