import { Factory } from "@server/types/core-types";
import { create } from "zustand";

interface FactoryStore {
  factory: Factory,
  setFactory: (factory: Factory) => void,
};

const emptyFactory: Factory = {
  machines: {},
  pipes: {},
  groups: {},
};

export const useFactoryStore = create<FactoryStore>()(set => ({
  factory: emptyFactory,
  setFactory: factory => set(() => ({ factory: factory })),
}));