import { MarkerType, type Edge, type EdgeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";

export function getEdgesForFactory(factory: Factory): Edge[] {
  return Object.values(factory.pipes).map(pipe => ({
    id: pipe.id,
    source: pipe.from,
    target: pipe.to,
    markerEnd: {
      type: MarkerType.Arrow,
      width: 20,
      height: 20,
    },
    style: {
      strokeWidth: 2,
    },
    data: {
      nickname: pipe.nickname,
      filter: pipe.filter,
    }
  }));
}

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
