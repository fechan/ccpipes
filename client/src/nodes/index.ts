import type { Node, NodeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { MachineNode } from "./MachineNode";
import { GroupNode } from "./GroupNode";

export function getNodesForFactory(factory: Factory): Node[] {
  const nodes = [];

  for (let [i, machine] of Object.values(factory.machines).entries()) {
    nodes.push({
      id: machine.id,
      type: "machine",
      position: { x: 100 + 100*i, y: 100 },
      data: { machine: machine },
    } as Node);


    for (let [i, groupId] of machine.groups.entries()) {
      const group = factory.groups[groupId];
      nodes.push({
        id: group.id,
        type: "slot-group",
        position: { x: 10 + 50*i, y: 30 },
        data: { group: group },
        parentId: machine.id,
        extent: "parent",
      } as Node);
    }
  }

  return nodes;
}

export const nodeTypes = {
  "machine": MachineNode,
  "slot-group": GroupNode,
} satisfies NodeTypes;
