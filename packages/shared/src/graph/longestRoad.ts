import { TopologyGraph } from './topology.js';
import { Building, Hyperlane } from '../types/building.js';


/**
 * Calculates the longest continuous trade route (hyperlane sequence) for a specific player.
 *
 * Rules:
 * 1. An uninterrupted sequence of hyperlane segments without branching.
 * 2. No hyperlane segment (edge) can be used more than once in the same path.
 * 3. An opponent's outpost or starbase on an intermediate vertex breaks the route through that vertex.
 * 4. The player's own outposts/starbases DO NOT break the route.
 */
export function calculateLongestRoadForPlayer(
  playerId: string,
  topology: TopologyGraph,
  roads: Map<string, Hyperlane>,
  buildings: Map<string, Building>
): number {
  const playerEdges = new Set<string>();
  for (const [edgeKey, road] of roads.entries()) {
    if (road.playerId === playerId) {
      playerEdges.add(edgeKey);
    }
  }

  if (playerEdges.size === 0) {
    return 0;
  }

  const candidateVertices = new Set<string>();
  for (const edgeKey of playerEdges) {
    const endpoints = topology.edgeToVertices.get(edgeKey);
    if (endpoints) {
      candidateVertices.add(endpoints[0]);
      candidateVertices.add(endpoints[1]);
    }
  }

  let maxLen = 0;

  function dfs(
    currentVertex: string,
    visitedEdges: Set<string>,
    currentLength: number
  ): void {
    if (currentLength > maxLen) {
      maxLen = currentLength;
    }

    const building = buildings.get(currentVertex);
    if (building && building.playerId !== playerId && currentLength > 0) {
      return;
    }

    const connectedEdges = topology.vertexToEdges.get(currentVertex) || [];
    for (const nextEdge of connectedEdges) {
      if (!playerEdges.has(nextEdge) || visitedEdges.has(nextEdge)) {
        continue;
      }

      const endpoints = topology.edgeToVertices.get(nextEdge);
      if (!endpoints) continue;

      const nextVertex = endpoints[0] === currentVertex ? endpoints[1] : endpoints[0];

      visitedEdges.add(nextEdge);
      dfs(nextVertex, visitedEdges, currentLength + 1);
      visitedEdges.delete(nextEdge);
    }
  }

  for (const startVertex of candidateVertices) {
    dfs(startVertex, new Set<string>(), 0);
  }

  return maxLen;
}

export const calculateLongestRouteForPlayer = calculateLongestRoadForPlayer;

export interface LongestRoadResult {
  holderPlayerId: string | null;
  longestLength: number;
}
export type LongestRouteResult = LongestRoadResult;

/**
 * Evaluates who holds the "Longest Trade Route" special title (2 Influence Points).
 * - Minimum required length is 5 connected hyperlanes.
 */
export function updateLongestRoadHolder(
  currentHolderId: string | null,
  playerIds: string[],
  topology: TopologyGraph,
  roads: Map<string, Hyperlane>,
  buildings: Map<string, Building>
): LongestRoadResult {
  const lengths = new Map<string, number>();
  for (const pid of playerIds) {
    lengths.set(pid, calculateLongestRoadForPlayer(pid, topology, roads, buildings));
  }

  const currentHolderLen = currentHolderId ? (lengths.get(currentHolderId) || 0) : 0;

  if (currentHolderId && currentHolderLen >= 5) {
    let bestNewPlayer: string | null = null;
    let bestNewLen = currentHolderLen;

    for (const [pid, len] of lengths.entries()) {
      if (pid !== currentHolderId && len > bestNewLen) {
        bestNewLen = len;
        bestNewPlayer = pid;
      }
    }

    if (bestNewPlayer) {
      return { holderPlayerId: bestNewPlayer, longestLength: bestNewLen };
    }
    return { holderPlayerId: currentHolderId, longestLength: currentHolderLen };
  }

  let highestLen = 4; // Must be >= 5
  let highestPlayer: string | null = null;
  let isTied = false;

  for (const [pid, len] of lengths.entries()) {
    if (len > highestLen) {
      highestLen = len;
      highestPlayer = pid;
      isTied = false;
    } else if (len === highestLen && highestLen >= 5) {
      isTied = true;
    }
  }

  if (highestPlayer && !isTied && highestLen >= 5) {
    return { holderPlayerId: highestPlayer, longestLength: highestLen };
  }

  return { holderPlayerId: null, longestLength: highestLen >= 5 ? highestLen : 0 };
}

export const updateLongestRouteHolder = updateLongestRoadHolder;
