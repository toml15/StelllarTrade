import { HexCoord, CubeCoord } from '../types/hex.js';

export function axialToCube(coord: HexCoord): CubeCoord {
  return {
    q: coord.q,
    r: coord.r,
    s: -coord.q - coord.r,
  };
}

export function cubeToAxial(cube: CubeCoord): HexCoord {
  return {
    q: cube.q,
    r: cube.r,
  };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ca = axialToCube(a);
  const cb = axialToCube(b);
  return Math.max(
    Math.abs(ca.q - cb.q),
    Math.abs(ca.r - cb.r),
    Math.abs(ca.s - cb.s)
  );
}

export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // North-East
  { q: 0, r: -1 },  // North-West
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // South-West
  { q: 0, r: 1 },   // South-East
] as const;

export function getHexNeighbor(coord: HexCoord, directionIndex: number): HexCoord {
  const dir = HEX_DIRECTIONS[(directionIndex % 6 + 6) % 6];
  return {
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  };
}

export function getHexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((dir) => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

/**
 * Calculates 2D pixel center for a pointy-topped hexagon.
 * @param coord axial coordinate
 * @param hexRadius outer radius (distance from center to vertex)
 */
export function hexToPixel(coord: HexCoord, hexRadius: number): { x: number; y: number } {
  const x = hexRadius * Math.sqrt(3) * (coord.q + coord.r / 2);
  const y = hexRadius * (3 / 2) * coord.r;
  return { x, y };
}

/**
 * Calculates the 6 corner coordinates in pixels for a pointy-topped hexagon.
 */
export function hexCornerPixels(center: { x: number; y: number }, hexRadius: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    // For pointy-topped, angles are 30°, 90°, 150°, 210°, 270°, 330°
    // In screen coordinates (y-down), angle 90° points downwards.
    const angleDeg = 60 * i + 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + hexRadius * Math.cos(angleRad),
      y: center.y + hexRadius * Math.sin(angleRad),
    });
  }
  return corners;
}
