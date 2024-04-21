import { Factory } from "@server/types/core-types";
import { Delta, patch } from "jsondiffpatch";
import { create } from "zustand";

interface FactoryStore {
  factory: Factory,
  setFactory: (factory: Factory) => void,
  patchFactory: (diff: Delta) => void,
};

const emptyFactory: Factory = {
  machines: {},
  pipes: {},
  groups: {},
};

export const useFactoryStore = create<FactoryStore>()(set => ({
  factory: emptyFactory,
  setFactory: factory => set(() => ({ factory: factory })),
  patchFactory: diff => set(state => ({ factory: patch(state.factory, diff) as Factory }))
}));