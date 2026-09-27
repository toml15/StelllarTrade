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
export declare function calculateLongestRoadForPlayer(playerId: string, topology: TopologyGraph, roads: Map<string, Hyperlane>, buildings: Map<string, Building>): number;
export declare const calculateLongestRouteForPlayer: typeof calculateLongestRoadForPlayer;
export interface LongestRoadResult {
    holderPlayerId: string | null;
    longestLength: number;
}
export type LongestRouteResult = LongestRoadResult;
/**
 * Evaluates who holds the "Longest Trade Route" special title (2 Influence Points).
 * - Minimum required length is 5 connected hyperlanes.
 */
export declare function updateLongestRoadHolder(currentHolderId: string | null, playerIds: string[], topology: TopologyGraph, roads: Map<string, Hyperlane>, buildings: Map<string, Building>): LongestRoadResult;
export declare const updateLongestRouteHolder: typeof updateLongestRoadHolder;
//# sourceMappingURL=longestRoad.d.ts.map