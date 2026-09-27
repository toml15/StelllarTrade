import { HexCoord } from '../types/hex.js';
/**
 * Serializes a HexCoord to a compact string "q,r".
 */
export declare function hexToString(h: HexCoord): string;
/**
 * Parses a string "q,r" back to HexCoord.
 */
export declare function stringToHex(s: string): HexCoord;
/**
 * Compares two HexCoords lexikographically: first by q, then by r.
 */
export declare function compareHexCoords(a: HexCoord, b: HexCoord): number;
/**
 * Creates a canonical edge hash key: `edge:q1,r1|q2,r2` (ordered).
 */
export declare function createEdgeKey(h1: HexCoord, h2: HexCoord): string;
/**
 * Parses a canonical edge key into the two adjacent HexCoords.
 */
export declare function parseEdgeKey(key: string): [HexCoord, HexCoord];
/**
 * Creates a canonical vertex hash key: `vertex:q1,r1|q2,r2|q3,r3` (ordered).
 */
export declare function createVertexKey(h1: HexCoord, h2: HexCoord, h3: HexCoord): string;
/**
 * Parses a canonical vertex key into the three surrounding HexCoords.
 */
export declare function parseVertexKey(key: string): [HexCoord, HexCoord, HexCoord];
/**
 * Calculates the exact 2D pixel position of a vertex.
 * Since a vertex is equidistant to the centers of the three surrounding hexagons,
 * its position is simply the centroid of the three hexagon centers!
 */
export declare function vertexToPixel(vertexKey: string, hexRadius: number): {
    x: number;
    y: number;
};
/**
 * Calculates the midpoint 2D pixel position of an edge.
 */
export declare function edgeMidpointPixel(edgeKey: string, hexRadius: number): {
    x: number;
    y: number;
};
//# sourceMappingURL=canonical.d.ts.map