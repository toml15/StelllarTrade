import { HexCoord, HexTile, HexType } from '../types/hex.js';
import { Harbor, HarborType } from '../types/harbor.js';
import {
  STANDARD_BASE_CHIPS,
  STANDARD_BASE_TILES,
} from '../constants/gameConstants.js';
import { buildTopologyGraph, TopologyGraph } from '../graph/topology.js';
import { hexDistance, getHexNeighbors } from '../geometry/coordinates.js';
import { createEdgeKey } from '../geometry/canonical.js';

// The 19 playable planetary hex coordinates
export const BASE_GAME_HEX_COORDS: HexCoord[] = [
  // Row 1 (r = -2): 3 hexes
  { q: 0, r: -2 },
  { q: 1, r: -2 },
  { q: 2, r: -2 },
  // Row 2 (r = -1): 4 hexes
  { q: -1, r: -1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: 2, r: -1 },
  // Row 3 (r = 0): 5 hexes
  { q: -2, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 0 },
  { q: 1, r: 0 },
  { q: 2, r: 0 },
  // Row 4 (r = 1): 4 hexes
  { q: -2, r: 1 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
  { q: 1, r: 1 },
  // Row 5 (r = 2): 3 hexes
  { q: -2, r: 2 },
  { q: -1, r: 2 },
  { q: 0, r: 2 },
];

// Outer-to-inner counter-clockwise spiral for number chip placement
export const SPIRAL_COORDS_ORDER: HexCoord[] = [
  // Outer ring (12 hexes)
  { q: 0, r: -2 },
  { q: -1, r: -1 },
  { q: -2, r: 0 },
  { q: -2, r: 1 },
  { q: -2, r: 2 },
  { q: -1, r: 2 },
  { q: 0, r: 2 },
  { q: 1, r: 1 },
  { q: 2, r: 0 },
  { q: 2, r: -1 },
  { q: 2, r: -2 },
  { q: 1, r: -2 },
  // Inner ring (6 hexes)
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  // Center (1 hex)
  { q: 0, r: 0 },
];

export interface BoardState {
  tiles: HexTile[];
  harbors: Harbor[];
  robberCoord: HexCoord;
  topology: TopologyGraph;
}

/**
 * Standard fixed planet types matching the beginner sector layout
 */
export const STANDARD_TILES_LAYOUT: { coord: HexCoord; type: HexType }[] = [
  // Row 1
  { coord: { q: 0, r: -2 }, type: 'mineral' },
  { coord: { q: 1, r: -2 }, type: 'hydro' },
  { coord: { q: 2, r: -2 }, type: 'arboreal' },
  // Row 2
  { coord: { q: -1, r: -1 }, type: 'agri' },
  { coord: { q: 0, r: -1 }, type: 'silica' },
  { coord: { q: 1, r: -1 }, type: 'hydro' },
  { coord: { q: 2, r: -1 }, type: 'silica' },
  // Row 3
  { coord: { q: -2, r: 0 }, type: 'agri' },
  { coord: { q: -1, r: 0 }, type: 'arboreal' },
  { coord: { q: 0, r: 0 }, type: 'dead_world' },
  { coord: { q: 1, r: 0 }, type: 'arboreal' },
  { coord: { q: 2, r: 0 }, type: 'mineral' },
  // Row 4
  { coord: { q: -2, r: 1 }, type: 'arboreal' },
  { coord: { q: -1, r: 1 }, type: 'mineral' },
  { coord: { q: 0, r: 1 }, type: 'agri' },
  { coord: { q: 1, r: 1 }, type: 'hydro' },
  // Row 5
  { coord: { q: -2, r: 2 }, type: 'silica' },
  { coord: { q: -1, r: 2 }, type: 'agri' },
  { coord: { q: 0, r: 2 }, type: 'hydro' },
];

/**
 * Standard orbital ports around the perimeter of the 19-planet galactic sector
 */
export function createStandardHarbors(topology: TopologyGraph): Harbor[] {
  // 9 orbital ports: 4 generic 3:1 orbital ports and 5 2:1 dedicated docks
  const harborDefs: {
    id: string;
    type: HarborType;
    resource?: import('../types/resource.js').ResourceType;
    landHex: HexCoord;
    seaHex: HexCoord;
  }[] = [
    // Top-left
    { id: 'h1', type: 'generic_3_1', landHex: { q: 0, r: -2 }, seaHex: { q: 0, r: -3 } },
    // Top-right
    { id: 'h2', type: 'rations_2_1', resource: 'rations', landHex: { q: 2, r: -2 }, seaHex: { q: 2, r: -3 } },
    // Upper-right
    { id: 'h3', type: 'titanium_2_1', resource: 'titanium', landHex: { q: 2, r: -1 }, seaHex: { q: 3, r: -2 } },
    // Lower-right
    { id: 'h4', type: 'generic_3_1', landHex: { q: 2, r: 0 }, seaHex: { q: 3, r: 0 } },
    // Bottom-right
    { id: 'h5', type: 'polymers_2_1', resource: 'polymers', landHex: { q: 0, r: 2 }, seaHex: { q: 1, r: 2 } },
    // Bottom
    { id: 'h6', type: 'generic_3_1', landHex: { q: -1, r: 2 }, seaHex: { q: -1, r: 3 } },
    // Bottom-left
    { id: 'h7', type: 'generic_3_1', landHex: { q: -2, r: 2 }, seaHex: { q: -3, r: 3 } },
    // Lower-left
    { id: 'h8', type: 'silicon_2_1', resource: 'silicon', landHex: { q: -2, r: 1 }, seaHex: { q: -3, r: 1 } },
    // Upper-left
    { id: 'h9', type: 'carbon_2_1', resource: 'carbon', landHex: { q: -1, r: -1 }, seaHex: { q: -2, r: -1 } },
  ];

  const harbors: Harbor[] = [];

  for (const def of harborDefs) {
    const edgeKey = createEdgeKey(def.landHex, def.seaHex);
    const endpoints = topology.edgeToVertices.get(edgeKey);
    if (endpoints) {
      harbors.push({
        id: def.id,
        type: def.type,
        resource: def.resource,
        edgeKey,
        vertexKeys: endpoints,
      });
    }
  }

  return harbors;
}

/**
 * Shuffles an array in place using Fisher-Yates.
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Validates that red numbers (6 and 8) are not adjacent to each other.
 */
export function validateRedNumbersNotAdjacent(tiles: HexTile[]): boolean {
  const redTiles = tiles.filter((t) => t.diceNumber === 6 || t.diceNumber === 8);
  for (let i = 0; i < redTiles.length; i++) {
    for (let j = i + 1; j < redTiles.length; j++) {
      if (hexDistance(redTiles[i].coord, redTiles[j].coord) === 1) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Generates the standard board setup according to sector charts.
 */
export function generateStandardBoard(): BoardState {
  const topology = buildTopologyGraph(BASE_GAME_HEX_COORDS);

  // Map coord to type
  const typeMap = new Map<string, HexType>();
  for (const item of STANDARD_TILES_LAYOUT) {
    typeMap.set(`${item.coord.q},${item.coord.r}`, item.type);
  }

  // Assign number chips along the spiral, skipping dead_world
  const tiles: HexTile[] = [];
  let chipIndex = 0;
  let robberCoord: HexCoord = { q: 0, r: 0 };

  for (const coord of SPIRAL_COORDS_ORDER) {
    const key = `${coord.q},${coord.r}`;
    const type = typeMap.get(key) || 'dead_world';

    if (type === 'dead_world') {
      robberCoord = coord;
      tiles.push({
        id: `tile_${key}`,
        coord,
        type,
        diceNumber: null,
        letter: null,
      });
    } else {
      const chip = STANDARD_BASE_CHIPS[chipIndex++];
      tiles.push({
        id: `tile_${key}`,
        coord,
        type,
        diceNumber: chip.diceNumber,
        letter: chip.letter,
      });
    }
  }

  const harbors = createStandardHarbors(topology);

  return {
    tiles,
    harbors,
    robberCoord,
    topology,
  };
}

/**
 * Generates a randomized board with valid 6/8 distribution (6 and 8 never adjacent).
 */
export function generateRandomBoard(): BoardState {
  const topology = buildTopologyGraph(BASE_GAME_HEX_COORDS);

  // Pool of tiles
  const tileTypesPool: HexType[] = [];
  for (const def of STANDARD_BASE_TILES) {
    for (let i = 0; i < def.count; i++) {
      tileTypesPool.push(def.type);
    }
  }

  let valid = false;
  let finalTiles: HexTile[] = [];
  let robberCoord: HexCoord = { q: 0, r: 0 };

  let attempts = 0;
  while (!valid && attempts < 1000) {
    attempts++;
    const shuffledTypes = shuffle(tileTypesPool);
    const shuffledChips = shuffle(STANDARD_BASE_CHIPS);

    const tiles: HexTile[] = [];
    let chipIndex = 0;

    for (let i = 0; i < SPIRAL_COORDS_ORDER.length; i++) {
      const coord = SPIRAL_COORDS_ORDER[i];
      const key = `${coord.q},${coord.r}`;
      const type = shuffledTypes[i];

      if (type === 'dead_world') {
        robberCoord = coord;
        tiles.push({
          id: `tile_${key}`,
          coord,
          type,
          diceNumber: null,
          letter: null,
        });
      } else {
        const chip = shuffledChips[chipIndex++];
        tiles.push({
          id: `tile_${key}`,
          coord,
          type,
          diceNumber: chip.diceNumber,
          letter: chip.letter,
        });
      }
    }

    if (validateRedNumbersNotAdjacent(tiles)) {
      valid = true;
      finalTiles = tiles;
    }
  }

  if (!valid) {
    return generateStandardBoard();
  }

  const harbors = createStandardHarbors(topology);

  return {
    tiles: finalTiles,
    harbors,
    robberCoord,
    topology,
  };
}

/**
 * Creates 19 shuffled draft tiles (18 resource planets + 1 dead world).
 */
export function generateDraftTiles(): HexTile[] {
  const resourceTypes: HexType[] = [];
  for (const def of STANDARD_BASE_TILES) {
    if (def.type !== 'dead_world') {
      for (let i = 0; i < def.count; i++) {
        resourceTypes.push(def.type);
      }
    }
  }

  const shuffledTypes = shuffle(resourceTypes);
  const tiles: HexTile[] = [];

  for (let i = 0; i < 18; i++) {
    tiles.push({
      id: `draft_tile_${i}`,
      coord: { q: 0, r: 0 },
      type: shuffledTypes[i],
      diceNumber: null,
      letter: null,
    });
  }

  // 1 Dead World tile
  tiles.push({
    id: 'draft_tile_dead_world',
    coord: { q: 0, r: 0 },
    type: 'dead_world',
    diceNumber: null,
    letter: null,
  });

  return shuffle(tiles);
}

/**
 * Validates that no two adjacent hex tiles have the same dice number.
 */
export function validateNoAdjacentIdenticalNumbers(tiles: HexTile[]): boolean {
  for (let i = 0; i < tiles.length; i++) {
    const t1 = tiles[i];
    if (t1.diceNumber === null) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      const t2 = tiles[j];
      if (t2.diceNumber === null) continue;
      if (hexDistance(t1.coord, t2.coord) === 1 && t1.diceNumber === t2.diceNumber) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Fairly distributes number chips to the placed tiles once the draft is complete
 */
export function assignFairDraftNumbers(tiles: HexTile[], topology?: TopologyGraph): HexTile[] {
  const resourceTiles = tiles.filter((t) => t.type !== 'dead_world');
  if (resourceTiles.length === 0) return tiles;

  const top = topology || buildTopologyGraph(BASE_GAME_HEX_COORDS);
  const chipsPool = [...STANDARD_BASE_CHIPS];

  const PIPS: Record<number, number> = {
    2: 1, 12: 1,
    3: 2, 11: 2,
    4: 3, 10: 3,
    5: 4, 9: 4,
    6: 5, 8: 5,
  };

  const adj: number[][] = [];
  for (let i = 0; i < resourceTiles.length; i++) {
    adj[i] = [];
    for (let j = 0; j < resourceTiles.length; j++) {
      if (i !== j && hexDistance(resourceTiles[i].coord, resourceTiles[j].coord) === 1) {
        adj[i].push(j);
      }
    }
  }

  const vertexToTileIndices: number[][] = [];
  for (const [, hexCoords] of top.vertexToHexCoords.entries()) {
    const indices: number[] = [];
    for (const c of hexCoords) {
      const idx = resourceTiles.findIndex((t) => t.coord.q === c.q && t.coord.r === c.r);
      if (idx !== -1) indices.push(idx);
    }
    if (indices.length > 0) vertexToTileIndices.push(indices);
  }

  for (let tier = 1; tier <= 3; tier++) {
    const maxAttempts = tier === 1 ? 3000 : tier === 2 ? 1500 : 1500;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shuffledChips = shuffle(chipsPool);
      let valid = true;

      for (let i = 0; i < resourceTiles.length; i++) {
        const numA = shuffledChips[i].diceNumber;
        for (const j of adj[i]) {
          if (j > i) {
            const numB = shuffledChips[j].diceNumber;
            if (numA === numB) {
              valid = false;
              break;
            }
            if ((numA === 6 || numA === 8) && (numB === 6 || numB === 8)) {
              valid = false;
              break;
            }
          }
        }
        if (!valid) break;
      }
      if (!valid) continue;

      if (tier === 1) {
        const redPerResource: Record<string, number> = {};
        for (let i = 0; i < resourceTiles.length; i++) {
          if (shuffledChips[i].diceNumber === 6 || shuffledChips[i].diceNumber === 8) {
            const t = resourceTiles[i].type;
            redPerResource[t] = (redPerResource[t] || 0) + 1;
            if (redPerResource[t] > 1) {
              valid = false;
              break;
            }
          }
        }
        if (!valid) continue;
      }

      const maxPips = tier === 1 ? 12 : tier === 2 ? 13 : 15;
      for (const indices of vertexToTileIndices) {
        let sum = 0;
        for (const idx of indices) {
          sum += PIPS[shuffledChips[idx].diceNumber] || 0;
        }
        if (sum > maxPips) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      const assignedMap = new Map<string, { diceNumber: number; letter: string }>();
      for (let i = 0; i < resourceTiles.length; i++) {
        const key = `${resourceTiles[i].coord.q},${resourceTiles[i].coord.r}`;
        assignedMap.set(key, {
          diceNumber: shuffledChips[i].diceNumber,
          letter: shuffledChips[i].letter,
        });
      }

      return tiles.map((tile) => {
        if (tile.type === 'dead_world') {
          return {
            ...tile,
            diceNumber: null,
            letter: null,
          };
        }
        const key = `${tile.coord.q},${tile.coord.r}`;
        const assignment = assignedMap.get(key);
        return {
          ...tile,
          diceNumber: assignment ? assignment.diceNumber : null,
          letter: assignment ? assignment.letter : null,
        };
      });
    }
  }

  return tiles;
}

export function getValidDraftCoordinates(placedTiles: HexTile[]): HexCoord[] {
  const placedSet = new Set(placedTiles.map((t) => `${t.coord.q},${t.coord.r}`));

  if (placedTiles.length === 0) {
    return BASE_GAME_HEX_COORDS.filter((c) => hexDistance(c, { q: 0, r: 0 }) === 2);
  }

  return BASE_GAME_HEX_COORDS.filter((c) => {
    const key = `${c.q},${c.r}`;
    if (placedSet.has(key)) return false;

    const neighbors = getHexNeighbors(c);
    return neighbors.some((n) => placedSet.has(`${n.q},${n.r}`));
  });
}
