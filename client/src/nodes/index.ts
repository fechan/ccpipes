import type { Node, NodeTypes } from "reactflow";
import { PositionLoggerNode } from "./PositionLoggerNode";
import factory from "../factory.json";
import { Machine } from "../types/core-types";
import { MachineNode } from "./MachineNode";
import { GroupNode } from "./GroupNode";

function getNodesForFactory(factory: Machine[]): Node[] {
  const nodes = [];

  for (let [i, machine] of factory.entries()) {
    nodes.push({
      id: machine.id,
      type: "machine",
      position: { x: 100 + 100*i, y: 100 },
      data: { machine: machine },
      style: {
        width: 800,
        height: 800,
      }
    } as Node);

    for (let [i, group] of machine.groups.entries()) {
      nodes.push({
        id: group.id,
        type: "slot-group",
        position: { x: 10, y: 10 + 10*i },
        data: { group: group },
        parentId: machine.id,
        extent: "parent",
        expandParent: false,
      } as Node);
    }
  }

  return nodes;
}

export const initialNodes = getNodesForFactory(factory);
export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  "machine": MachineNode,
  "slot-group": GroupNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
