import { ResourceType } from './resource.js';
export interface HexCoord {
    q: number;
    r: number;
}
export interface CubeCoord {
    q: number;
    r: number;
    s: number;
}
export type PlanetHexType = 'arboreal' | 'silica' | 'hydro' | 'agri' | 'mineral' | 'dead_world';
export type HexType = PlanetHexType | 'deep_space';
export declare const HEX_RESOURCE_MAP: Partial<Record<HexType, ResourceType>>;
export interface HexTile {
    id: string;
    coord: HexCoord;
    type: HexType;
    diceNumber: number | null;
    letter: string | null;
}
//# sourceMappingURL=hex.d.ts.map