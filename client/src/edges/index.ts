import type { Edge, EdgeTypes } from "reactflow";
import { Factory, Machine } from "../types/core-types";
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

// export const initialEdges = [
//   { id: "a->c", source: "a", target: "c", animated: true },
//   { id: "b->d", source: "b", target: "d" },
//   { id: "c->d", source: "c", target: "d", animated: true },
// ] satisfies Edge[];

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
