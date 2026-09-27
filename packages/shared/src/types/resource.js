export const ALL_RESOURCES = ['carbon', 'silicon', 'polymers', 'rations', 'titanium'];
export function createEmptyResourceCount() {
    return {
        carbon: 0,
        silicon: 0,
        polymers: 0,
        rations: 0,
        titanium: 0,
    };
}
export function getTotalResourceCount(resources) {
    return (resources.carbon +
        resources.silicon +
        resources.polymers +
        resources.rations +
        resources.titanium);
}
//# sourceMappingURL=resource.js.map