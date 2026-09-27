import { hexToPixel } from './coordinates.js';
/**
 * Serializes a HexCoord to a compact string "q,r".
 */
export function hexToString(h) {
    return `${h.q},${h.r}`;
}
/**
 * Parses a string "q,r" back to HexCoord.
 */
export function stringToHex(s) {
    const [qStr, rStr] = s.split(',');
    return { q: parseInt(qStr, 10), r: parseInt(rStr, 10) };
}
/**
 * Compares two HexCoords lexikographically: first by q, then by r.
 */
export function compareHexCoords(a, b) {
    if (a.q !== b.q) {
        return a.q - b.q;
    }
    return a.r - b.r;
}
/**
 * Creates a canonical edge hash key: `edge:q1,r1|q2,r2` (ordered).
 */
export function createEdgeKey(h1, h2) {
    const sorted = [h1, h2].sort(compareHexCoords);
    return `edge:${hexToString(sorted[0])}|${hexToString(sorted[1])}`;
}
/**
 * Parses a canonical edge key into the two adjacent HexCoords.
 */
export function parseEdgeKey(key) {
    const raw = key.replace(/^edge:/, '');
    const [first, second] = raw.split('|');
    return [stringToHex(first), stringToHex(second)];
}
/**
 * Creates a canonical vertex hash key: `vertex:q1,r1|q2,r2|q3,r3` (ordered).
 */
export function createVertexKey(h1, h2, h3) {
    const sorted = [h1, h2, h3].sort(compareHexCoords);
    return `vertex:${hexToString(sorted[0])}|${hexToString(sorted[1])}|${hexToString(sorted[2])}`;
}
/**
 * Parses a canonical vertex key into the three surrounding HexCoords.
 */
export function parseVertexKey(key) {
    const raw = key.replace(/^vertex:/, '');
    const [h1, h2, h3] = raw.split('|');
    return [stringToHex(h1), stringToHex(h2), stringToHex(h3)];
}
/**
 * Calculates the exact 2D pixel position of a vertex.
 * Since a vertex is equidistant to the centers of the three surrounding hexagons,
 * its position is simply the centroid of the three hexagon centers!
 */
export function vertexToPixel(vertexKey, hexRadius) {
    const [h1, h2, h3] = parseVertexKey(vertexKey);
    const p1 = hexToPixel(h1, hexRadius);
    const p2 = hexToPixel(h2, hexRadius);
    const p3 = hexToPixel(h3, hexRadius);
    return {
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3,
    };
}
/**
 * Calculates the midpoint 2D pixel position of an edge.
 */
export function edgeMidpointPixel(edgeKey, hexRadius) {
    const [h1, h2] = parseEdgeKey(edgeKey);
    const p1 = hexToPixel(h1, hexRadius);
    const p2 = hexToPixel(h2, hexRadius);
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
}
//# sourceMappingURL=canonical.js.map