import { HexCoord } from '../types/hex.js';
import { Building, Hyperlane } from '../types/building.js';
export interface TopologyGraph {
    vertexKeys: Set<string>;
    edgeKeys: Set<string>;
    vertexToEdges: Map<string, string[]>;
    vertexNeighbors: Map<string, string[]>;
    edgeToVertices: Map<string, [string, string]>;
    edgeNeighbors: Map<string, string[]>;
    hexToVertices: Map<string, string[]>;
    hexToEdges: Map<string, string[]>;
    vertexToHexCoords: Map<string, HexCoord[]>;
}
/**
 * Finds the two mutual neighbor hexes between two adjacent hexes h1 and h2.
 */
export declare function getMutualHexNeighbors(h1: HexCoord, h2: HexCoord): [HexCoord, HexCoord];
/**
 * Builds the complete topology graph for a set of playable planetary hexes.
 */
export declare function buildTopologyGraph(landHexes: HexCoord[]): TopologyGraph;
/**
 * Validates the Outpost Exclusion Distance Rule:
 * An Outpost or Starbase can only be built if the vertex itself and all its
 * directly adjacent neighbor vertices (distance of 1 edge) are unoccupied.
 */
export declare function validateDistanceRule(vertexKey: string, topology: TopologyGraph, buildings: Map<string, Building>): boolean;
/**
 * Validates whether a player can establish a Hyperlane on an edge during normal play.
 * Conditions:
 * 1. Edge must not be occupied by any hyperlane.
 * 2. Edge must connect to:
 *    a) Player's own Outpost or Starbase at one of the endpoints, OR
 *    b) Player's own Hyperlane at one of the endpoints, provided that the endpoint
 *       is not blocked by a RIVAL Outpost or Starbase!
 */
export declare function validateRoadPlacement(edgeKey: string, playerId: string, topology: TopologyGraph, roads: Map<string, Hyperlane>, buildings: Map<string, Building>): boolean;
export declare const validateHyperlanePlacement: typeof validateRoadPlacement;
/**
 * Validates whether a commander can build an Outpost during normal play.
 * Must obey the distance rule AND connect to at least one of player's own Hyperlanes.
 */
export declare function validateSettlementPlacement(vertexKey: string, playerId: string, topology: TopologyGraph, roads: Map<string, Hyperlane>, buildings: Map<string, Building>): boolean;
export declare const validateOutpostPlacement: typeof validateSettlementPlacement;
//# sourceMappingURL=topology.d.ts.map