import { HexCoord, HexTile, HexType } from '../types/hex.js';
import { Harbor } from '../types/harbor.js';
import { TopologyGraph } from '../graph/topology.js';
export declare const BASE_GAME_HEX_COORDS: HexCoord[];
export declare const SPIRAL_COORDS_ORDER: HexCoord[];
export interface BoardState {
    tiles: HexTile[];
    harbors: Harbor[];
    robberCoord: HexCoord;
    topology: TopologyGraph;
}
/**
 * Standard fixed planet types matching the beginner sector layout
 */
export declare const STANDARD_TILES_LAYOUT: {
    coord: HexCoord;
    type: HexType;
}[];
/**
 * Standard orbital ports around the perimeter of the 19-planet galactic sector
 */
export declare function createStandardHarbors(topology: TopologyGraph): Harbor[];
/**
 * Validates that red numbers (6 and 8) are not adjacent to each other.
 */
export declare function validateRedNumbersNotAdjacent(tiles: HexTile[]): boolean;
/**
 * Generates the standard board setup according to sector charts.
 */
export declare function generateStandardBoard(): BoardState;
/**
 * Generates a randomized board with valid 6/8 distribution (6 and 8 never adjacent).
 */
export declare function generateRandomBoard(): BoardState;
/**
 * Creates 19 shuffled draft tiles (18 resource planets + 1 dead world).
 */
export declare function generateDraftTiles(): HexTile[];
/**
 * Validates that no two adjacent hex tiles have the same dice number.
 */
export declare function validateNoAdjacentIdenticalNumbers(tiles: HexTile[]): boolean;
/**
 * Fairly distributes number chips to the placed tiles once the draft is complete
 */
export declare function assignFairDraftNumbers(tiles: HexTile[], topology?: TopologyGraph): HexTile[];
export declare function getValidDraftCoordinates(placedTiles: HexTile[]): HexCoord[];
//# sourceMappingURL=boardGenerator.d.ts.map