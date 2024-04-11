import type { Edge, EdgeTypes } from "reactflow";
import { Factory } from "../types/core-types";
import { getAllPipes } from "../util/factory-graph";
import factory from "../factory.json";

function getEdgesForFactory(factory: Factory): Edge[] {
  return getAllPipes(factory).map(pipe => ({
    id: pipe.id,
    source: pipe.from,
    target: pipe.to,
  }));
}

export const initialEdges = getEdgesForFactory(factory);

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
