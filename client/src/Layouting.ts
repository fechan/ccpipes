import { Factory } from "@server/types/core-types";
import ELK, { ElkNode, LayoutOptions } from "elkjs";
import { Edge, Instance, Node } from "reactflow";

import { getHeight, getWidth } from "./nodes/GroupNode";

const elk = new ELK();

const elkOptions: LayoutOptions = {
  "elk.direction": "DOWN",
  "elk.algorithm": "layered",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.layered.layering.strategy": "INTERACTIVE",
  "elk.layered.cycleBreaking.strategy": "INTERACTIVE",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.layered.spacing.baseValue": "60",
};

export async function getLayoutedElements(nodes: Node[], edges: Edge[], factory: Factory) {
  const nodeMap: {[nodeId: string]: Node} = {};
  for (let node of nodes) {
    nodeMap[node.id] = node;
  }

  const graph: ElkNode = {
    id: "root",
    layoutOptions: elkOptions,
    edges: edges.map(edge => ({ ...edge, sources: [edge.source], targets: [edge.target]})),
    children: [],
  }

  for (let [machineId, machine] of Object.entries(factory.machines)) {
    const machineNodeFlow = nodeMap[machineId];
    const machineNodeElk: ElkNode = {
      ...machineNodeFlow,
      layoutOptions: {
        "elk.padding": "[top=30,right=30,bottom=30,left=30]",
      },
      width: 1,
      height: 1,
      children: [],
      x: machine.x || 0,
      y: machine.y || 0,
    }
    graph.children!.push(machineNodeElk);

    for (let groupId of machine.groups) {
      const group = factory.groups[groupId];
      const groupNodeFlow = nodeMap[groupId];

      const groupNodeElk: ElkNode = {
        ...groupNodeFlow,
        width: getWidth(group.slots.length),
        height: getHeight(group.slots.length),
      };
      machineNodeElk.children!.push(groupNodeElk);
      
      if (group.x) {
        groupNodeElk.x = group.x;
        groupNodeElk.y = group.y;
      }
    }
  }

  // fulfill width information first
  let layout = await elk.layout(graph);

  // layout again with fixed x,y positions if they exist in the factory
  const graph2: ElkNode = {
    id: "root",
    layoutOptions: elkOptions,
    edges: edges.map(edge => ({ ...edge, sources: [edge.source], targets: [edge.target]})),
    children: [],
  }

  for (let machineNodeElk of layout.children || []) {
    const newMachineNodeElk: ElkNode = {
      ...nodeMap[machineNodeElk.id],
      layoutOptions: {
        "elk.padding": "[top=30,right=30,bottom=30,left=30]",
      },
      x: machineNodeElk.x,
      y: machineNodeElk.y,
      width: machineNodeElk.width,
      height: machineNodeElk.height,
      children: [],
    };

    // if (x,y) position is defined in the factory, set the position and set noLayout
    const machine = factory.machines[machineNodeElk.id];
    if (machine.x) {
      newMachineNodeElk.x = machine.x;
      newMachineNodeElk.y = machine.y;
      newMachineNodeElk.layoutOptions = { "elk.noLayout": "true" };
    }

    for (let groupNodeElk of machineNodeElk.children || []) {
      newMachineNodeElk.children!.push({
        ...nodeMap[groupNodeElk.id],
        x: groupNodeElk.x,
        y: groupNodeElk.y,
        width: groupNodeElk.width,
        height: groupNodeElk.height,
      });
    }

    graph2.children?.push(newMachineNodeElk);
  }

  layout = await elk.layout(graph2);

  const layoutedNodes: Node[] = [];
  for (let machineNodeElk of layout.children!) {
    layoutedNodes.push({
      ...machineNodeElk,
      position: { x: machineNodeElk.x || 0, y: machineNodeElk.y || 0 },
      style: { width: machineNodeElk.width, height: machineNodeElk.height },
      data: {},
    });

    for (let groupNodeElk of machineNodeElk.children!) {
      layoutedNodes.push({
        ...groupNodeElk,
        position: { x: groupNodeElk.x || 0, y: groupNodeElk.y || 0 },
        style: { width: groupNodeElk.width, height: groupNodeElk.height },
        parentId: machineNodeElk.id,
        data: {},
      });
    }
  }

  return layoutedNodes;
}