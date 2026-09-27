import { ResourceType } from './resource.js';

export type OrbitalPortType =
  | 'generic_3_1'
  | 'carbon_2_1'
  | 'silicon_2_1'
  | 'polymers_2_1'
  | 'rations_2_1'
  | 'titanium_2_1';

export type HarborType = OrbitalPortType;

export interface OrbitalPort {
  id: string;
  type: OrbitalPortType;
  resource?: ResourceType; // Defined if 2:1 dedicated dock
  vertexKeys: [string, string]; // Exactly two vertices on the orbital perimeter
  edgeKey: string;              // The edge between the two vertices
}

export type Harbor = OrbitalPort;
