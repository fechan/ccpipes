import { Factory } from "@server/types/core-types";
import ELK, { ElkNode, LayoutOptions } from "elkjs";
import { Edge, Instance, Node } from "reactflow";

import { getHeight, getWidth } from "./nodes/GroupNode";

const elk = new ELK();

const elkOptions: LayoutOptions = {
  "elk.direction": "RIGHT",
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "80",
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
      width: 1,
      height: 1,
      children: [],
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
    }
  }

  const layout = await elk.layout(graph);
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