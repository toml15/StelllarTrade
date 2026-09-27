import { ResourceType } from './resource.js';
export type OrbitalPortType = 'generic_3_1' | 'carbon_2_1' | 'silicon_2_1' | 'polymers_2_1' | 'rations_2_1' | 'titanium_2_1';
export type HarborType = OrbitalPortType;
export interface OrbitalPort {
    id: string;
    type: OrbitalPortType;
    resource?: ResourceType;
    vertexKeys: [string, string];
    edgeKey: string;
}
export type Harbor = OrbitalPort;
//# sourceMappingURL=harbor.d.ts.map