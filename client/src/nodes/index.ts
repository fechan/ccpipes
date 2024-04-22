import type { Node, NodeTypes } from "reactflow";
import { Factory } from "@server/types/core-types";
import { MachineNode } from "./MachineNode";
import { GroupNode } from "./GroupNode";
import { FactoryAddsAndDeletes, GroupParentsMap } from "../stores/factory";

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
        data: {
          group: group,
          machineId: machine.id,
        },
        parentId: machine.id,
        extent: "parent",
      } as Node);
    }
  }

  return nodes;
}

export function createAddedNodes(factory: Factory, addsAndDeletes: FactoryAddsAndDeletes, groupParents: GroupParentsMap) {
  const newMachines = addsAndDeletes.machines.adds;
  const newGroups = addsAndDeletes.groups.adds;

  const newNodes: Node[] = [];

  for (let machineId of newMachines) {
    const machineNode: Node = {
      id: machineId,
      type: "machine",
      position: { x: 0, y: 0 },
      style: { width: 350, height: 300 },
      data: { machine: factory.machines[machineId] }, // TODO: remove after converting everything to use the factory store
    };
    newNodes.push(machineNode);
  }

  for (let groupId of newGroups) {
    const groupNode: Node = {
      id: groupId,
      type: "slot-group",
      position: { x: 0, y: 0 },
      parentId: groupParents[groupId],
      extent: "parent",
      data: { group: factory.groups[groupId], machineId: groupParents[groupId] } // TODO: remove after converting everything to use the factory store
    };
    newNodes.push(groupNode)
  }

  return newNodes;
}

export function updateNodesForFactory(oldNodes: Node[], factory: Factory, addsAndDeletes: FactoryAddsAndDeletes, groupParents: GroupParentsMap) {
  const newNodes = oldNodes.filter(node => !(addsAndDeletes.groups.deletes.has(node.id) ||
    addsAndDeletes.machines.deletes.has(node.id) ||
    addsAndDeletes.pipes.deletes.has(node.id)
  ));
  return newNodes.concat(createAddedNodes(factory, addsAndDeletes, groupParents));
}

export const nodeTypes = {
  "machine": MachineNode,
  "slot-group": GroupNode,
} satisfies NodeTypes;
