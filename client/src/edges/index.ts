import type { Edge, EdgeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { getAllPipes } from "../util/factory-graph";

export function getEdgesForFactory(factory: Factory): Edge[] {
  return getAllPipes(factory).map(pipe => ({
    id: pipe.id,
    source: pipe.from,
    target: pipe.to,
  }));
}

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
