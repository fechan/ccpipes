import { Factory, GroupId, MachineId } from "@server/types/core-types";
import { Delta, patch } from "jsondiffpatch";
import { create } from "zustand";

interface AddsAndDeletes {
  adds: string[],
  deletes: string[],
}

interface FactoryAddsAndDeletes {
  pipes: AddsAndDeletes,
  machines: AddsAndDeletes,
  groups: AddsAndDeletes,
}

interface FactoryStore {
  /** Factory object */
  factory: Factory,
  /** Map from group IDs in the factory to their parent machine's ID */
  groupParents: {[key: GroupId]: MachineId},
  /** IDs of added or deleted nodes from the last factory update/patch */
  addsAndDeletes: FactoryAddsAndDeletes,
  setFactory: (factory: Factory) => void,
  patchFactory: (diffs: Delta[]) => void,
};

const emptyFactory: Factory = {
  machines: {},
  pipes: {},
  groups: {},
};

const emptyFactoryAddsAndDeletes: FactoryAddsAndDeletes = {
  machines: {adds: [], deletes: []},
  pipes: {adds: [], deletes: []},
  groups: {adds: [], deletes: []},
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

function collectAddsAndDeletes(diff: Delta, addsAndDeletes?: FactoryAddsAndDeletes) {
  if (diff === undefined) {
    return;
  }

  if (addsAndDeletes === undefined) {
    addsAndDeletes = {
      machines: {adds: [], deletes: []},
      pipes: {adds: [], deletes: []},
      groups: {adds: [], deletes: []},
    };
  }

  for (let componentType of Object.keys(diff)) {
    if (["machines", "pipes", "groups"].includes(componentType)) {
      for (let [componentId, delta] of Object.entries(diff[componentType])) {
        if (delta.length === 1) {
          addsAndDeletes[componentType].adds.push(componentId);
        } else if (delta.length === 3) {
          addsAndDeletes[componentType].deletes.push(componentId);
        }
      }
    }
  }

  return addsAndDeletes;
}

export const useFactoryStore = create<FactoryStore>()(set => ({
  factory: emptyFactory,
  groupParents: {},
  addsAndDeletes: emptyFactoryAddsAndDeletes,
  setFactory: factory => set(() => ({
    factory: factory,
    groupParents: getGroupParents(factory),
  })),
  patchFactory: diffs => set(state => {
    let updatedFactory = state.factory;
    let addsAndDeletes: FactoryAddsAndDeletes | undefined;
    for (let diff of diffs) {
      updatedFactory = patch(updatedFactory, diff) as Factory;
      addsAndDeletes = collectAddsAndDeletes(diff, addsAndDeletes)
    }

    return {
      factory: updatedFactory,
      groupParents: getGroupParents(updatedFactory),
      addsAndDeletes: addsAndDeletes,
    };
  })
}));