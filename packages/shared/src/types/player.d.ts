import { ResourceCount } from './resource.js';
import { TechModule } from './cards.js';
export type PlayerColor = 'red' | 'blue' | 'white' | 'orange' | 'green' | 'brown';
export interface Player {
    id: string;
    name: string;
    color: PlayerColor;
    isBot: boolean;
    isConnected: boolean;
    isReady: boolean;
    resources: ResourceCount;
    techModules: TechModule[];
    playedPatrolFrigates: number;
    hyperlanesLeft: number;
    outpostsLeft: number;
    starbasesLeft: number;
    victoryPoints: number;
    hiddenVictoryPoints: number;
    hasLongestRoad: boolean;
    longestRoadLength: number;
    hasLargestArmy: boolean;
}
export declare const PLAYER_COLORS_BASE: PlayerColor[];
export declare const PLAYER_COLORS_5_6: PlayerColor[];
//# sourceMappingURL=player.d.ts.map