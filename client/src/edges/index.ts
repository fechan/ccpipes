import { MarkerType, type Edge, type EdgeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { PipeEdge } from "./PipeEdge";
import { FactoryAddsAndDeletes } from "../stores/factory";

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
      color: "black",
    }
  }));
}

function createAddedEdges(factory: Factory, addsAndDeletes: FactoryAddsAndDeletes) {
  const newPipes = addsAndDeletes.pipes.adds;

  const newEdges: Edge[] = [];

  for (let pipeId of newPipes) {
    const pipeEdge: Edge = {
      id: pipeId,
      type: "pipe",
      source: factory.pipes[pipeId].from,
      target: factory.pipes[pipeId].to,
      markerEnd: {
        type: MarkerType.Arrow,
        width: 15,
        height: 15,
        color: "black"
      }
    };
    newEdges.push(pipeEdge);
  }

  return newEdges;
}

export function updateEdgesForFactory(oldEdges: Edge[], factory: Factory, addsAndDeletes: FactoryAddsAndDeletes) {
  const newEdges = oldEdges.filter(edge => !addsAndDeletes.pipes.deletes.has(edge.id));
  return newEdges.concat(createAddedEdges(factory, addsAndDeletes));
}

export const edgeTypes = {
  "pipe": PipeEdge,
} satisfies EdgeTypes;
