import { Factory, GroupId, MachineId } from "@server/types/core-types";
import { Delta, patch } from "jsondiffpatch";
import { create } from "zustand";

interface FactoryStore {
  factory: Factory,
  groupParents: {[key: GroupId]: MachineId},
  setFactory: (factory: Factory) => void,
  patchFactory: (diff: Delta) => void,
};

const emptyFactory: Factory = {
  machines: {},
  pipes: {},
  groups: {},
};

/**
 * Get a map from group IDs to their parent machine ID
 * @param factory Factory the groups and machines are in
 * @returns Map from group IDs to parent machine IDs
 */
function getGroupParents(factory: Factory) {
  const groupParents: {[key: GroupId]: MachineId} = {};
  for (const machine of Object.values(factory.machines)) {
    for (const groupId of machine.groups) {
      groupParents[groupId] = machine.id;
    }
  }
  return groupParents;
}

export const useFactoryStore = create<FactoryStore>()(set => ({
  factory: emptyFactory,
  groupParents: {},
  setFactory: factory => set(() => ({
    factory: factory,
    groupParents: getGroupParents(factory),
  })),
  patchFactory: diff => set(state => {
    const updatedFactory = patch(state.factory, diff) as Factory;
    return {
      factory: updatedFactory,
      groupParents: getGroupParents(updatedFactory),
    };
  })
}));