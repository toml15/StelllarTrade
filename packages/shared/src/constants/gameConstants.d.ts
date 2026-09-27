import { ResourceType } from '../types/resource.js';
import { BuildingType } from '../types/building.js';
import { TechModuleType } from '../types/cards.js';
export declare const BUILDING_COSTS: Record<BuildingType | 'outpost' | 'starbase' | 'road' | 'hyperlane' | 'settlement' | 'city' | 'devCard' | 'techModule', Partial<Record<ResourceType, number>>>;
export declare const INITIAL_PIECE_LIMITS: {
    roads: number;
    hyperlanes: number;
    settlements: number;
    outposts: number;
    cities: number;
    starbases: number;
};
export declare const DICE_PROBABILITIES: Record<number, number>;
export declare const STANDARD_BASE_TILES: {
    type: import('../types/hex.js').HexType;
    count: number;
}[];
export declare const STANDARD_BASE_CHIPS: {
    letter: string;
    diceNumber: number;
}[];
export declare const BASE_DEV_CARD_DECK: TechModuleType[];
//# sourceMappingURL=gameConstants.d.ts.map