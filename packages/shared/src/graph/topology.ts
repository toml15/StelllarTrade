import { HexCoord } from '../types/hex.js';
import {
  createEdgeKey,
  createVertexKey,
  parseEdgeKey,
  parseVertexKey,
} from '../geometry/canonical.js';
import { getHexNeighbors } from '../geometry/coordinates.js';
import { Building, Hyperlane } from '../types/building.js';


export interface TopologyGraph {
  // Set of all valid land & coastal vertex keys
  vertexKeys: Set<string>;
  // Set of all valid land & coastal edge keys
  edgeKeys: Set<string>;
  // Map vertexKey -> array of adjacent edgeKeys (up to 3)
  vertexToEdges: Map<string, string[]>;
  // Map vertexKey -> array of adjacent vertexKeys (up to 3)
  vertexNeighbors: Map<string, string[]>;
  // Map edgeKey -> the 2 endpoint vertexKeys
  edgeToVertices: Map<string, [string, string]>;
  // Map edgeKey -> adjacent edgeKeys sharing an endpoint
  edgeNeighbors: Map<string, string[]>;
  // Map hexCoord "q,r" -> the 6 vertexKeys
  hexToVertices: Map<string, string[]>;
  // Map hexCoord "q,r" -> the 6 edgeKeys
  hexToEdges: Map<string, string[]>;
  // Map vertexKey -> the surrounding planetary HexCoords
  vertexToHexCoords: Map<string, HexCoord[]>;
}

/**
 * Finds the two mutual neighbor hexes between two adjacent hexes h1 and h2.
 */
export function getMutualHexNeighbors(h1: HexCoord, h2: HexCoord): [HexCoord, HexCoord] {
  const n1 = getHexNeighbors(h1);
  const n2 = getHexNeighbors(h2);

  const mutual: HexCoord[] = [];
  for (const a of n1) {
    for (const b of n2) {
      if (a.q === b.q && a.r === b.r) {
        mutual.push(a);
      }
    }
  }

  if (mutual.length !== 2) {
    throw new Error(
      `Hexes (${h1.q},${h1.r}) and (${h2.q},${h2.r}) must be adjacent to have 2 mutual neighbors (found ${mutual.length})`
    );
  }

  return [mutual[0], mutual[1]];
}

/**
 * Builds the complete topology graph for a set of playable planetary hexes.
 */
export function buildTopologyGraph(landHexes: HexCoord[]): TopologyGraph {
  const landCoords = new Set(landHexes.map((h) => `${h.q},${h.r}`));

  const vertexKeys = new Set<string>();
  const edgeKeys = new Set<string>();
  const vertexToEdges = new Map<string, string[]>();
  const vertexNeighbors = new Map<string, string[]>();
  const edgeToVertices = new Map<string, [string, string]>();
  const edgeNeighbors = new Map<string, string[]>();
  const hexToVertices = new Map<string, string[]>();
  const hexToEdges = new Map<string, string[]>();
  const vertexToHexCoords = new Map<string, HexCoord[]>();

  // For every planetary hex, collect its 6 edges and 6 vertices
  for (const hex of landHexes) {
    const hexKey = `${hex.q},${hex.r}`;
    const hVertices: string[] = [];
    const hEdges: string[] = [];

    const neighbors = getHexNeighbors(hex);

    // 6 edges connecting this hex to its 6 neighbors
    for (let i = 0; i < 6; i++) {
      const neighbor = neighbors[i];
      const eKey = createEdgeKey(hex, neighbor);
      edgeKeys.add(eKey);
      hEdges.push(eKey);

      // The 6 vertices are the intersections with adjacent neighbor pairs
      const nextNeighbor = neighbors[(i + 1) % 6];
      const vKey = createVertexKey(hex, neighbor, nextNeighbor);
      vertexKeys.add(vKey);
      hVertices.push(vKey);
    }

    hexToVertices.set(hexKey, hVertices);
    hexToEdges.set(hexKey, hEdges);
  }

  // Calculate relationships between Vertices and Edges
  for (const vKey of vertexKeys) {
    const [h1, h2, h3] = parseVertexKey(vKey);

    const surrounding = [h1, h2, h3].filter((h) => landCoords.has(`${h.q},${h.r}`));
    vertexToHexCoords.set(vKey, surrounding);

    const e1 = createEdgeKey(h1, h2);
    const e2 = createEdgeKey(h2, h3);
    const e3 = createEdgeKey(h1, h3);

    const adjEdges: string[] = [];
    if (edgeKeys.has(e1)) adjEdges.push(e1);
    if (edgeKeys.has(e2)) adjEdges.push(e2);
    if (edgeKeys.has(e3)) adjEdges.push(e3);

    vertexToEdges.set(vKey, adjEdges);
  }

  for (const eKey of edgeKeys) {
    const [h1, h2] = parseEdgeKey(eKey);
    const [m1, m2] = getMutualHexNeighbors(h1, h2);

    const v1 = createVertexKey(h1, h2, m1);
    const v2 = createVertexKey(h1, h2, m2);

    edgeToVertices.set(eKey, [v1, v2]);
  }

  for (const vKey of vertexKeys) {
    const adjEdges = vertexToEdges.get(vKey) || [];
    const neighbors: string[] = [];

    for (const eKey of adjEdges) {
      const endpoints = edgeToVertices.get(eKey);
      if (endpoints) {
        const other = endpoints[0] === vKey ? endpoints[1] : endpoints[0];
        if (vertexKeys.has(other) && !neighbors.includes(other)) {
          neighbors.push(other);
        }
      }
    }

    vertexNeighbors.set(vKey, neighbors);
  }

  for (const eKey of edgeKeys) {
    const endpoints = edgeToVertices.get(eKey);
    const adjEdges: string[] = [];

    if (endpoints) {
      for (const ep of endpoints) {
        const connectedEdges = vertexToEdges.get(ep) || [];
        for (const ce of connectedEdges) {
          if (ce !== eKey && edgeKeys.has(ce) && !adjEdges.includes(ce)) {
            adjEdges.push(ce);
          }
        }
      }
    }

    edgeNeighbors.set(eKey, adjEdges);
  }

  return {
    vertexKeys,
    edgeKeys,
    vertexToEdges,
    vertexNeighbors,
    edgeToVertices,
    edgeNeighbors,
    hexToVertices,
    hexToEdges,
    vertexToHexCoords,
  };
}

/**
 * Validates the Outpost Exclusion Distance Rule:
 * An Outpost or Starbase can only be built if the vertex itself and all its
 * directly adjacent neighbor vertices (distance of 1 edge) are unoccupied.
 */
export function validateDistanceRule(
  vertexKey: string,
  topology: TopologyGraph,
  buildings: Map<string, Building>
): boolean {
  if (buildings.has(vertexKey)) {
    return false;
  }

  const neighbors = topology.vertexNeighbors.get(vertexKey) || [];
  for (const neighbor of neighbors) {
    if (buildings.has(neighbor)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates whether a player can establish a Hyperlane on an edge during normal play.
 * Conditions:
 * 1. Edge must not be occupied by any hyperlane.
 * 2. Edge must connect to:
 *    a) Player's own Outpost or Starbase at one of the endpoints, OR
 *    b) Player's own Hyperlane at one of the endpoints, provided that the endpoint
 *       is not blocked by a RIVAL Outpost or Starbase!
 */
export function validateRoadPlacement(
  edgeKey: string,
  playerId: string,
  topology: TopologyGraph,
  roads: Map<string, Hyperlane>,
  buildings: Map<string, Building>
): boolean {
  if (roads.has(edgeKey)) {
    return false;
  }

  const endpoints = topology.edgeToVertices.get(edgeKey);
  if (!endpoints) return false;

  for (const endpoint of endpoints) {
    const building = buildings.get(endpoint);

    if (building && building.playerId === playerId) {
      return true;
    }

    if (building && building.playerId !== playerId) {
      continue;
    }

    const connectedEdges = topology.vertexToEdges.get(endpoint) || [];
    for (const otherEdge of connectedEdges) {
      if (otherEdge === edgeKey) continue;
      const road = roads.get(otherEdge);
      if (road && road.playerId === playerId) {
        return true;
      }
    }
  }

  return false;
}

export const validateHyperlanePlacement = validateRoadPlacement;

/**
 * Validates whether a commander can build an Outpost during normal play.
 * Must obey the distance rule AND connect to at least one of player's own Hyperlanes.
 */
export function validateSettlementPlacement(
  vertexKey: string,
  playerId: string,
  topology: TopologyGraph,
  roads: Map<string, Hyperlane>,
  buildings: Map<string, Building>
): boolean {
  if (!validateDistanceRule(vertexKey, topology, buildings)) {
    return false;
  }

  const connectedEdges = topology.vertexToEdges.get(vertexKey) || [];
  for (const edgeKey of connectedEdges) {
    const road = roads.get(edgeKey);
    if (road && road.playerId === playerId) {
      return true;
    }
  }

  return false;
}

export const validateOutpostPlacement = validateSettlementPlacement;
