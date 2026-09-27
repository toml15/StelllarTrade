import { ResourceType } from '../types/resource.js';
import { BuildingType } from '../types/building.js';
import { TechModuleType } from '../types/cards.js';

export const BUILDING_COSTS: Record<
  | BuildingType
  | 'outpost'
  | 'starbase'
  | 'road'
  | 'hyperlane'
  | 'settlement'
  | 'city'
  | 'devCard'
  | 'techModule',
  Partial<Record<ResourceType, number>>
> = {
  road: {
    carbon: 1,
    silicon: 1,
  },
  hyperlane: {
    carbon: 1,
    silicon: 1,
  },
  settlement: {
    carbon: 1,
    silicon: 1,
    polymers: 1,
    rations: 1,
  },
  outpost: {
    carbon: 1,
    silicon: 1,
    polymers: 1,
    rations: 1,
  },
  city: {
    rations: 2,
    titanium: 3,
  },
  starbase: {
    rations: 2,
    titanium: 3,
  },
  devCard: {
    polymers: 1,
    rations: 1,
    titanium: 1,
  },
  techModule: {
    polymers: 1,
    rations: 1,
    titanium: 1,
  },
};

export const INITIAL_PIECE_LIMITS = {
  roads: 15,
  hyperlanes: 15,
  settlements: 5,
  outposts: 5,
  cities: 4,
  starbases: 4,
};

export const DICE_PROBABILITIES: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

export const STANDARD_BASE_TILES: { type: import('../types/hex.js').HexType; count: number }[] = [
  { type: 'arboreal', count: 4 },
  { type: 'hydro', count: 4 },
  { type: 'agri', count: 4 },
  { type: 'silica', count: 3 },
  { type: 'mineral', count: 3 },
  { type: 'dead_world', count: 1 },
];

export const STANDARD_BASE_CHIPS: { letter: string; diceNumber: number }[] = [
  { letter: 'A', diceNumber: 5 },
  { letter: 'B', diceNumber: 2 },
  { letter: 'C', diceNumber: 6 },
  { letter: 'D', diceNumber: 3 },
  { letter: 'E', diceNumber: 8 },
  { letter: 'F', diceNumber: 10 },
  { letter: 'G', diceNumber: 9 },
  { letter: 'H', diceNumber: 12 },
  { letter: 'I', diceNumber: 11 },
  { letter: 'J', diceNumber: 4 },
  { letter: 'K', diceNumber: 8 },
  { letter: 'L', diceNumber: 10 },
  { letter: 'M', diceNumber: 9 },
  { letter: 'N', diceNumber: 4 },
  { letter: 'O', diceNumber: 5 },
  { letter: 'P', diceNumber: 6 },
  { letter: 'Q', diceNumber: 3 },
  { letter: 'R', diceNumber: 11 },
];

export const BASE_DEV_CARD_DECK: TechModuleType[] = [
  // 14 Patrol Frigates (formerly Knights)
  ...Array(14).fill('patrol_frigate'),
  // 5 Colony Milestones (formerly Victory Points)
  ...Array(5).fill('colony_milestone'),
  // 2 Hyperlane Expansions (formerly Road Building)
  ...Array(2).fill('hyperlane_expansion'),
  // 2 Quantum Synthesis (formerly Year of Plenty)
  ...Array(2).fill('quantum_synthesis'),
  // 2 Trade Embargoes (formerly Monopoly)
  ...Array(2).fill('trade_embargo'),
];
