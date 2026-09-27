export type ResourceType = 'carbon' | 'silicon' | 'polymers' | 'rations' | 'titanium';
export type ResourceCount = Record<ResourceType, number>;
export declare const ALL_RESOURCES: ResourceType[];
export declare function createEmptyResourceCount(): ResourceCount;
export declare function getTotalResourceCount(resources: ResourceCount): number;
//# sourceMappingURL=resource.d.ts.map