export type BuildingType = 'outpost' | 'starbase';

export interface Building {
  type: BuildingType;
  playerId: string;
  vertexKey: string;
}

export interface Hyperlane {
  playerId: string;
  edgeKey: string;
}

export type Road = Hyperlane;
