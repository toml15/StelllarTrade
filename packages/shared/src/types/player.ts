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
  hyperlanesLeft: number;        // Max 15
  outpostsLeft: number;          // Max 5
  starbasesLeft: number;         // Max 4
  victoryPoints: number;         // Influence Points (Public)
  hiddenVictoryPoints: number;   // Hidden Influence Points from Colony Milestones
  hasLongestRoad: boolean;       // Longest Trade Route title holder
  longestRoadLength: number;
  hasLargestArmy: boolean;       // Fleet Supremacy title holder
}

export const PLAYER_COLORS_BASE: PlayerColor[] = ['red', 'blue', 'white', 'orange'];
export const PLAYER_COLORS_5_6: PlayerColor[] = ['red', 'blue', 'white', 'orange', 'green', 'brown'];
