import type { Node, NodeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { MachineNode } from "./MachineNode";
import { GroupNode } from "./GroupNode";

export function getNodesForFactory(factory: Factory): Node[] {
  const nodes = [];

  for (let [machineIdx, machine] of Object.values(factory.machines).entries()) {
    nodes.push({
      id: machine.id,
      type: "machine",
      position: { x: 100 + 100*machineIdx, y: 100 },
      data: { machine: machine },
      style: {
        width: 350,
        height: 300,
      }
    } as Node);


    for (let [groupIdx, groupId] of machine.groups.entries()) {
      const group = factory.groups[groupId];
      nodes.push({
        id: group.id,
        type: "slot-group",
        position: { x: 10 + 50*groupIdx, y: 30 },
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
