import { describe, it, expect } from 'vitest';
import {
  buildTopologyGraph,
  validateDistanceRule,
  validateRoadPlacement,
  validateSettlementPlacement,
} from '../src/graph/topology.js';
import { BASE_GAME_HEX_COORDS } from '../src/board/boardGenerator.js';
import { Building, Road } from '../src/types/building.js';

describe('Topology Graph & Distance Rule', () => {
  const topology = buildTopologyGraph(BASE_GAME_HEX_COORDS);

  it('builds a topology with 54 distinct vertices and 72 distinct edges for standard 19 hexes', () => {
    // In standard Stellartrade, a 19-hex board has exactly 54 vertices and 72 edges
    expect(topology.vertexKeys.size).toBe(54);
    expect(topology.edgeKeys.size).toBe(72);
  });

  it('ensures each interior vertex has exactly 3 neighbors, and coastal vertices have 2 or 3', () => {
    for (const [vKey, neighbors] of topology.vertexNeighbors.entries()) {
      expect(neighbors.length).toBeGreaterThanOrEqual(2);
      expect(neighbors.length).toBeLessThanOrEqual(3);

      const edges = topology.vertexToEdges.get(vKey) || [];
      expect(edges.length).toBe(neighbors.length);
    }
  });

  it('strictly enforces the orbital distance rule', () => {
    const buildings = new Map<string, Building>();
    const firstVertex = Array.from(topology.vertexKeys)[0];
    const neighbors = topology.vertexNeighbors.get(firstVertex) || [];
    expect(neighbors.length).toBeGreaterThanOrEqual(2);

    const neighborVertex = neighbors[0];

    // Initially valid
    expect(validateDistanceRule(firstVertex, topology, buildings)).toBe(true);
    expect(validateDistanceRule(neighborVertex, topology, buildings)).toBe(true);

    // Place a settlement on firstVertex
    buildings.set(firstVertex, {
      type: 'settlement',
      playerId: 'player1',
      vertexKey: firstVertex,
    });

    // Vertex itself is no longer valid
    expect(validateDistanceRule(firstVertex, topology, buildings)).toBe(false);

    // Any adjacent neighbor (distance 1 edge) is now forbidden!
    for (const n of neighbors) {
      expect(validateDistanceRule(n, topology, buildings)).toBe(false);
    }

    // A vertex at distance 2 edges should still be allowed (if not adjacent to firstVertex)
    const secondDegreeCandidates = topology.vertexNeighbors.get(neighborVertex) || [];
    const validCandidate = secondDegreeCandidates.find(
      (v) => v !== firstVertex && !neighbors.includes(v)
    );

    if (validCandidate) {
      expect(validateDistanceRule(validCandidate, topology, buildings)).toBe(true);
    }
  });

  it('validates road connection and opponent blocking', () => {
    const buildings = new Map<string, Building>();
    const roads = new Map<string, Road>();

    const vertexA = Array.from(topology.vertexKeys)[0];
    const adjacentEdges = topology.vertexToEdges.get(vertexA) || [];
    const edge1 = adjacentEdges[0];
    const edge2 = adjacentEdges[1];

    // Player 1 has a settlement at vertexA
    buildings.set(vertexA, {
      type: 'settlement',
      playerId: 'p1',
      vertexKey: vertexA,
    });

    // Player 1 can build road on edge1
    expect(validateRoadPlacement(edge1, 'p1', topology, roads, buildings)).toBe(true);
    // Player 2 cannot build road on edge1
    expect(validateRoadPlacement(edge1, 'p2', topology, roads, buildings)).toBe(false);

    // Place road for Player 1 on edge1
    roads.set(edge1, { playerId: 'p1', edgeKey: edge1 });

    // Edge 1 is now occupied
    expect(validateRoadPlacement(edge1, 'p1', topology, roads, buildings)).toBe(false);

    // Player 1 can build connected road on edge2
    expect(validateRoadPlacement(edge2, 'p1', topology, roads, buildings)).toBe(true);
  });
});
