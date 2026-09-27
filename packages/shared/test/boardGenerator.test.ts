import { describe, it, expect } from 'vitest';
import {
  generateStandardBoard,
  generateRandomBoard,
  validateRedNumbersNotAdjacent,
  generateDraftTiles,
  assignFairDraftNumbers,
  validateNoAdjacentIdenticalNumbers,
  BASE_GAME_HEX_COORDS,
} from '../src/board/boardGenerator.js';

describe('Board Generator (Stellartrade Galactic Sector)', () => {
  it('generates the standard sector with exactly 19 planets and 9 orbital ports', () => {
    const board = generateStandardBoard();

    expect(board.tiles).toHaveLength(19);
    expect(board.harbors).toHaveLength(9);

    // Dead World has no number and Void Corsair starts there
    const deadWorld = board.tiles.find((t) => t.type === 'dead_world')!;
    expect(deadWorld).toBeDefined();
    expect(deadWorld.diceNumber).toBeNull();
    expect(board.robberCoord).toEqual(deadWorld.coord);

    // Count planet types: 4 arboreal, 4 hydro, 4 agri, 3 silica, 3 mineral, 1 dead_world
    const counts = board.tiles.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(counts['arboreal']).toBe(4);
    expect(counts['hydro']).toBe(4);
    expect(counts['agri']).toBe(4);
    expect(counts['silica']).toBe(3);
    expect(counts['mineral']).toBe(3);
    expect(counts['dead_world']).toBe(1);

    // Red numbers (6 and 8) must not be adjacent
    expect(validateRedNumbersNotAdjacent(board.tiles)).toBe(true);
  });

  it('generates a random sector where 6 and 8 are never adjacent', () => {
    for (let testRun = 0; testRun < 10; testRun++) {
      const board = generateRandomBoard();
      expect(board.tiles).toHaveLength(19);
      expect(board.harbors).toHaveLength(9);

      // Verify red number adjacency constraint
      expect(validateRedNumbersNotAdjacent(board.tiles)).toBe(true);

      // Verify dice counts (should have 2x 6, 2x 8, etc.)
      const redNumbers = board.tiles.filter((t) => t.diceNumber === 6 || t.diceNumber === 8);
      expect(redNumbers).toHaveLength(4);
    }
  });

  it('generates draft planets without numbers, and assigns fair numbers with no adjacent identical numbers upon sector completion', () => {
    // 1. Initial draft planets must NOT have numbers assigned
    const draftTiles = generateDraftTiles();
    expect(draftTiles).toHaveLength(19);
    for (const tile of draftTiles) {
      expect(tile.diceNumber).toBeNull();
      expect(tile.letter).toBeNull();
    }

    // 2. Simulate 10 different board layouts with random placements
    for (let run = 0; run < 10; run++) {
      const placedTiles = draftTiles.map((t, idx) => ({
        ...t,
        coord: BASE_GAME_HEX_COORDS[idx],
      }));

      const finalizedTiles = assignFairDraftNumbers(placedTiles);

      // Dead World has no number
      const deadWorld = finalizedTiles.find((t) => t.type === 'dead_world')!;
      expect(deadWorld.diceNumber).toBeNull();

      // All 18 resource planets have valid numbers
      const resourceTiles = finalizedTiles.filter((t) => t.type !== 'dead_world');
      expect(resourceTiles).toHaveLength(18);
      for (const t of resourceTiles) {
        expect(t.diceNumber).not.toBeNull();
        expect(t.diceNumber).toBeGreaterThanOrEqual(2);
        expect(t.diceNumber).toBeLessThanOrEqual(12);
        expect(t.diceNumber).not.toBe(7);
      }

      // No two identical numbers adjacent
      expect(validateNoAdjacentIdenticalNumbers(finalizedTiles)).toBe(true);

      // No red numbers (6 and 8) adjacent
      expect(validateRedNumbersNotAdjacent(finalizedTiles)).toBe(true);
    }
  });
});
