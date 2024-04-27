import { Node } from "reactflow";
import { create } from "zustand";

interface DropTargetStore {
  dropTarget: Node | null,
  setDropTarget: (dropTarget: Node | null) => void,
  clearDropTarget: () => void,
}

export const useDropTargetStore = create<DropTargetStore>()(set => ({
  dropTarget: null,
  setDropTarget: dropTarget => set(() => ({ dropTarget: dropTarget })),
  clearDropTarget: () => set(() => ({ dropTarget: null }))
}));