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

  // convert React Flow graph to ELK graph format
  for (let [machineId, machine] of Object.entries(factory.machines)) {
    const machineNodeFlow = nodeMap[machineId];
    const machineNodeElk: ElkNode = {
      ...machineNodeFlow,
      layoutOptions: {
        "elk.padding": "[top=30,right=30,bottom=30,left=30]",
        "elk.layered.crossingMinimization.semiInteractive": "true", // allows groups to "position" themselves with elk.position
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
        layoutOptions: {
          "elk.position": `(${group.slots[0].slot * 100},1)`,
        },
        width: getWidth(group.slots.length),
        height: getHeight(group.slots.length),
      };
      machineNodeElk.children!.push(groupNodeElk);
    }
  }

  // lay out ELK graph
  let layout = await elk.layout(graph);

  // Convert back to React Flow Graph
  const layoutedNodes: Node[] = [];
  for (let machineNodeElk of layout.children!) {
    const machine = factory.machines[machineNodeElk.id];
    layoutedNodes.push({
      ...machineNodeElk,
      position: {
        x: machine.x || machineNodeElk.x || 0,
        y: machine.y || machineNodeElk.y || 0
      },
      style: { width: machineNodeElk.width, height: machineNodeElk.height },
      data: {},
    });

    for (let groupNodeElk of machineNodeElk.children!) {
      const group = factory.groups[groupNodeElk.id];
      layoutedNodes.push({
        ...groupNodeElk,
        position: {
          x: group.x || groupNodeElk.x || 0,
          y: group.y || groupNodeElk.y || 0
        },
        style: { width: groupNodeElk.width, height: groupNodeElk.height },
        parentId: machineNodeElk.id,
        data: {},
      });
    }
  }

  return layoutedNodes;
}