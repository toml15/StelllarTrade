export type ResourceType = 'carbon' | 'silicon' | 'polymers' | 'rations' | 'titanium';

export type ResourceCount = Record<ResourceType, number>;

export const ALL_RESOURCES: ResourceType[] = ['carbon', 'silicon', 'polymers', 'rations', 'titanium'];

export function createEmptyResourceCount(): ResourceCount {
  return {
    carbon: 0,
    silicon: 0,
    polymers: 0,
    rations: 0,
    titanium: 0,
  };
}

export function getTotalResourceCount(resources: ResourceCount): number {
  return (
    resources.carbon +
    resources.silicon +
    resources.polymers +
    resources.rations +
    resources.titanium
  );
}
