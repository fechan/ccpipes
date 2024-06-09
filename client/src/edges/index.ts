import { MarkerType, type Edge, type EdgeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { PipeEdge } from "./PipeEdge";
import { TempEdge } from "./TempEdge";

export function getEdgesForFactory(factory: Factory): Edge[] {
  return Object.values(factory.pipes).map(pipe => ({
    id: pipe.id,
    source: pipe.from,
    target: pipe.to,
    type: "pipe",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "magenta",
    }
  }));
}

export const edgeTypes = {
  "pipe": PipeEdge,
  "temp": TempEdge,
} satisfies EdgeTypes;
