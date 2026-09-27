import { describe, it, expect } from 'vitest';
import {
  buildTopologyGraph,
} from '../src/graph/topology.js';
import {
  calculateLongestRoadForPlayer,
  updateLongestRoadHolder,
} from '../src/graph/longestRoad.js';
import { BASE_GAME_HEX_COORDS } from '../src/board/boardGenerator.js';
import { Building, Road } from '../src/types/building.js';

describe('Longest Road Algorithm (DFS with Cycles & Blocking)', () => {
  const topology = buildTopologyGraph(BASE_GAME_HEX_COORDS);

  it('measures continuous chain of roads correctly', () => {
    const roads = new Map<string, Road>();
    const buildings = new Map<string, Building>();

    // Take center hex (0,0) edges
    const centerHexEdges = topology.hexToEdges.get('0,0') || [];
    expect(centerHexEdges.length).toBe(6);

    // Place 4 connected roads around the perimeter of the center hex
    for (let i = 0; i < 4; i++) {
      roads.set(centerHexEdges[i], {
        playerId: 'p1',
        edgeKey: centerHexEdges[i],
      });
    }

    const len = calculateLongestRoadForPlayer('p1', topology, roads, buildings);
    expect(len).toBe(4);
  });

  it('correctly handles full loops (cycles) without infinite recursion or duplicate edge counting', () => {
    const roads = new Map<string, Road>();
    const buildings = new Map<string, Building>();

    const centerHexEdges = topology.hexToEdges.get('0,0') || [];

    // Place all 6 roads forming a closed circle around the hex
    for (const eKey of centerHexEdges) {
      roads.set(eKey, { playerId: 'p1', edgeKey: eKey });
    }

    const len = calculateLongestRoadForPlayer('p1', topology, roads, buildings);
    // A simple path cannot traverse the same edge twice, so max path length in a 6-cycle is 6
    expect(len).toBe(6);
  });

  it('breaks opponent road transit when opponent settlement is placed on an intermediate vertex', () => {
    const roads = new Map<string, Road>();
    const buildings = new Map<string, Building>();

    const centerHexEdges = topology.hexToEdges.get('0,0') || [];

    // Place roads 0, 1, 2 for p1
    roads.set(centerHexEdges[0], { playerId: 'p1', edgeKey: centerHexEdges[0] });
    roads.set(centerHexEdges[1], { playerId: 'p1', edgeKey: centerHexEdges[1] });
    roads.set(centerHexEdges[2], { playerId: 'p1', edgeKey: centerHexEdges[2] });

    expect(calculateLongestRoadForPlayer('p1', topology, roads, buildings)).toBe(3);

    // Find the vertex between edge 0 and edge 1
    const ep0 = topology.edgeToVertices.get(centerHexEdges[0])!;
    const ep1 = topology.edgeToVertices.get(centerHexEdges[1])!;
    const sharedVertex = ep0.find((v) => ep1.includes(v))!;

    // Player 2 builds a settlement on that shared vertex!
    buildings.set(sharedVertex, {
      type: 'settlement',
      playerId: 'p2',
      vertexKey: sharedVertex,
    });

    // Road is now broken at that vertex! Edge 0 is separated from Edge 1 & 2.
    // The longest remaining segment is Edge 1 + Edge 2 = length 2.
    const brokenLen = calculateLongestRoadForPlayer('p1', topology, roads, buildings);
    expect(brokenLen).toBe(2);
  });

  it('awards and transfers Longest Road special card correctly (min 5, strict superiority)', () => {
    const roads = new Map<string, Road>();
    const buildings = new Map<string, Building>();

    // 4 edges: no one gets it
    const res1 = updateLongestRoadHolder(null, ['p1', 'p2'], topology, roads, buildings);
    expect(res1.holderPlayerId).toBeNull();

    // Give p1 5 edges
    const centerHexEdges = topology.hexToEdges.get('0,0') || [];
    for (let i = 0; i < 5; i++) {
      roads.set(centerHexEdges[i], { playerId: 'p1', edgeKey: centerHexEdges[i] });
    }

    const res2 = updateLongestRoadHolder(null, ['p1', 'p2'], topology, roads, buildings);
    expect(res2.holderPlayerId).toBe('p1');
    expect(res2.longestLength).toBe(5);

    // If p2 also gets 5 edges, p1 KEEPS it (tie does not transfer)
    // Add 5 edges for p2 on hex (1,0)
    const neighborHexEdges = topology.hexToEdges.get('1,0') || [];
    let p2Added = 0;
    for (const e of neighborHexEdges) {
      if (!roads.has(e) && p2Added < 5) {
        roads.set(e, { playerId: 'p2', edgeKey: e });
        p2Added++;
      }
    }

    const res3 = updateLongestRoadHolder('p1', ['p1', 'p2'], topology, roads, buildings);
    expect(res3.holderPlayerId).toBe('p1'); // Tie: p1 keeps it
  });
});
