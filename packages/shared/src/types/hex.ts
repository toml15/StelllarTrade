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

export type PlanetHexType =
  | 'arboreal'
  | 'silica'
  | 'hydro'
  | 'agri'
  | 'mineral'
  | 'dead_world';

export type HexType = PlanetHexType | 'deep_space';

export const HEX_RESOURCE_MAP: Partial<Record<HexType, ResourceType>> = {
  arboreal: 'carbon',
  silica: 'silicon',
  hydro: 'polymers',
  agri: 'rations',
  mineral: 'titanium',
};

export interface HexTile {
  id: string;
  coord: HexCoord;
  type: HexType;
  diceNumber: number | null; // null for dead_world and deep_space
  letter: string | null;     // A-R setup spiral letter
}
