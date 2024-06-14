import { Factory, GroupId, MachineId } from "@server/types/core-types";
import { Delta, patch } from "jsondiffpatch";
import { create } from "zustand";

interface FactoryStore {
  /** Factory object */
  factory: Factory,
  /** Map from group IDs in the factory to their parent machine's ID */
  groupParents: GroupParentsMap,
  /** Version counter that increments every time the factory is updated */
  version: number,
  setFactory: (factory: Factory) => void,
  patchFactory: (diffs: Delta[]) => void,
};

const emptyFactory: Factory = {
  machines: {},
  pipes: {},
  groups: {},
  missing: {},
  available: {},
};

export interface GroupParentsMap {
  [key: GroupId]: MachineId
};

/**
 * Get a map from group IDs to their parent machine ID
 * @param factory Factory the groups and machines are in
 * @returns Map from group IDs to parent machine IDs
 */
function getGroupParents(factory: Factory) {
  const groupParents: GroupParentsMap = {};
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
  version: 0,
  setFactory: factory => set(() => ({
    factory: factory,
    groupParents: getGroupParents(factory),
  })),
  patchFactory: diffs => set(state => {
    let updatedFactory = state.factory;
    for (let diff of diffs) {
      updatedFactory = patch(updatedFactory, diff) as Factory;
    }

    return {
      factory: updatedFactory,
      groupParents: getGroupParents(updatedFactory),
      version: state.version + 1,
    };
  })
}));