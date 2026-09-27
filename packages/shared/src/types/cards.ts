export type TechModuleType =
  | 'patrol_frigate'
  | 'hyperlane_expansion'
  | 'quantum_synthesis'
  | 'trade_embargo'
  | 'colony_milestone';

export interface TechModule {
  id: string;
  type: TechModuleType;
  turnBought: number; // Cannot be played on the turn it was acquired
}
