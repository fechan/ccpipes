import { Factory } from "@server/types/core-types";
import { create } from "zustand";

interface FactoryStore {
  factory: Factory | null,
  setFactory: (factory: Factory) => void,
};

export const useFactoryStore = create<FactoryStore>()(set => ({
  factory: null,
  setFactory: factory => set(() => ({ factory: factory })),
}));