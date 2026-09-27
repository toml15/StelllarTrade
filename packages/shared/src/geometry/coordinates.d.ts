import { HexCoord, CubeCoord } from '../types/hex.js';
export declare function axialToCube(coord: HexCoord): CubeCoord;
export declare function cubeToAxial(cube: CubeCoord): HexCoord;
export declare function hexDistance(a: HexCoord, b: HexCoord): number;
export declare const HEX_DIRECTIONS: readonly HexCoord[];
export declare function getHexNeighbor(coord: HexCoord, directionIndex: number): HexCoord;
export declare function getHexNeighbors(coord: HexCoord): HexCoord[];
/**
 * Calculates 2D pixel center for a pointy-topped hexagon.
 * @param coord axial coordinate
 * @param hexRadius outer radius (distance from center to vertex)
 */
export declare function hexToPixel(coord: HexCoord, hexRadius: number): {
    x: number;
    y: number;
};
/**
 * Calculates the 6 corner coordinates in pixels for a pointy-topped hexagon.
 */
export declare function hexCornerPixels(center: {
    x: number;
    y: number;
}, hexRadius: number): {
    x: number;
    y: number;
}[];
//# sourceMappingURL=coordinates.d.ts.map