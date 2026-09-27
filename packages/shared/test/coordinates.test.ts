import { describe, it, expect } from 'vitest';
import {
  axialToCube,
  cubeToAxial,
  hexDistance,
  getHexNeighbors,
  hexToPixel,
} from '../src/geometry/coordinates.js';

describe('Hex Coordinates & Geometry', () => {
  it('converts axial to cube coordinates and back', () => {
    const axial = { q: 2, r: -3 };
    const cube = axialToCube(axial);
    expect(cube).toEqual({ q: 2, r: -3, s: 1 });
    expect(cube.q + cube.r + cube.s).toBe(0);

    const backToAxial = cubeToAxial(cube);
    expect(backToAxial).toEqual(axial);
  });

  it('calculates correct hex distances', () => {
    const center = { q: 0, r: 0 };
    expect(hexDistance(center, center)).toBe(0);

    const neighbors = getHexNeighbors(center);
    expect(neighbors).toHaveLength(6);
    for (const n of neighbors) {
      expect(hexDistance(center, n)).toBe(1);
    }

    const distant = { q: 2, r: -2 };
    expect(hexDistance(center, distant)).toBe(2);
  });

  it('calculates 2D pixel positions centered at origin', () => {
    const center = { q: 0, r: 0 };
    const pos = hexToPixel(center, 50);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(0);
  });
});
