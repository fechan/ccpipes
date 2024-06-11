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
  "elk.layered.crossingMinimization.semiInteractive": "true", // allows machines to "position" themselves with elk.position
};

/**
 * Get a dictionary that maps each string in a string array to their position if
 * the array were sorted.
 * 
 * @param strings String array
 * @returns String position map
 */
function stringOrder(strings: string[]) {
  let stringOrder = {} as {[string: string]: number};

  strings = [...strings].sort()
  strings.forEach((str, i) => stringOrder[str] = i);

  return stringOrder;
}

/**
 * Lay out elements using ELK
 * 
 * @note ELK is kinda huge and it doesn't even handle fixed positions very well.
 * Should consider replacing it with another layout module.
 * 
 * @param nodes List of React Flow nodes to lay out
 * @param edges List of React Flow edges between nodes
 * @param factory State of the factory
 * @returns List of Reace Flow nodes with their layouted `position`s set
 */
export async function getLayoutedElements(nodes: Node[], edges: Edge[], factory: Factory) {
  const nodeMap: {[nodeId: string]: Node} = {};
  for (let node of nodes) {
    nodeMap[node.id] = node;
  }

  const graph: ElkNode = {
    id: "root",
    layoutOptions: elkOptions,
    //edges: edges.map(edge => ({ ...edge, sources: [edge.source], targets: [edge.target]})),
    children: [],
  }

  // convert React Flow graph to ELK graph format
  let machineOrder = stringOrder(Object.keys(factory.machines));

  for (let [machineId, machine] of Object.entries(factory.machines)) {
    const machineNodeFlow = nodeMap[machineId];
    const machineNodeElk: ElkNode = {
      ...machineNodeFlow,
      layoutOptions: {
        "elk.padding": "[top=30,right=30,bottom=30,left=30]",
        "elk.layered.crossingMinimization.semiInteractive": "true", // allows groups to "position" themselves with elk.position
        "elk.position": `(${machineOrder[machineId]},1)`,
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
          "elk.position": `(${group.slots[0].slot},1)`,
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
  const layoutedNodes: Node[] = []; // all nodes, now with the layout applied
  const nodesWithChanges: Node[] = []; // only nodes that were changed by the layouter
  for (let machineNodeElk of layout.children!) {
    const machine = factory.machines[machineNodeElk.id];
    const layoutedMachine: Node = {
      ...machineNodeElk,
      position: {
        x: machine.x || machineNodeElk.x || 0,
        y: machine.y || machineNodeElk.y || 0
      },
      style: { width: machineNodeElk.width, height: machineNodeElk.height },
      data: {},
    };
    layoutedNodes.push(layoutedMachine);
    if (!machine.x || !machine.y) nodesWithChanges.push(layoutedMachine);

    for (let groupNodeElk of machineNodeElk.children!) {
      const group = factory.groups[groupNodeElk.id];

      const layoutedGroup: Node = {
        ...groupNodeElk,
        position: {
          x: group.x || groupNodeElk.x || 0,
          y: group.y || groupNodeElk.y || 0
        },
        style: { width: groupNodeElk.width, height: groupNodeElk.height },
        parentId: machineNodeElk.id,
        data: {},
      };
      layoutedNodes.push(layoutedGroup);
      if (!group.x || !group.y) nodesWithChanges.push(layoutedGroup);
    }
  }

  return {layoutedNodes, nodesWithChanges};
}