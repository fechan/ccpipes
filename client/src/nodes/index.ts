import type { Node, NodeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { MachineNode } from "./MachineNode";
import { GroupNode } from "./GroupNode";
import { SlotNode } from "./SlotNode";

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
        style: {
          width: 20 + 30 * Math.min(group.slots.length, 9),
          height: 20 + 30 * Math.max(Math.floor(group.slots.length/9), 1),
        },
        parentId: machine.id,
        extent: "parent",
      } as Node);

      for (let [slotIdx, slot] of group.slots.entries()) {
        nodes.push({
          id: `${slot.periphId}:${slot.slot}`,
          type: "slot",
          position: { x: 10 + 30*(slotIdx % 9), y: 10 + 30 * Math.floor(slotIdx/9) },
          data: { periphId: slot.periphId, slot: slot.slot },
          style: {
            width: 30,
            height: 30,
          },
          parentId: group.id,
          extent: "parent",
        } as Node);
      }
    }
  }

  return nodes;
}

export const nodeTypes = {
  "machine": MachineNode,
  "slot-group": GroupNode,
  "slot": SlotNode,
} satisfies NodeTypes;
