import { createContext } from "react";
import { Node } from "reactflow";

export const DropTargetContext = createContext({
  dropTarget: null as (Node | null),
  setDropTarget: (node: (Node | null)) => {},
});