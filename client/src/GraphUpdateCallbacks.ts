import { Factory, Group, GroupId, Machine, MachineId, Pipe, PipeId } from "@server/types/core-types";
import { BatchRequest, GroupEditReq, MachineEditReq, PipeDelReq, PipeEditReq, Request } from "@server/types/messages";
import { Dispatch, DragEvent, MouseEvent, SetStateAction } from "react";
import { SendMessage } from "react-use-websocket/dist/lib/types";
import { boxToRect, Connection, Edge, Instance, MarkerType, Node, ReactFlowInstance } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { CombineHandlers } from "./CombineHandlers";
import { splitPeripheralFromMachine, splitSlotFromGroup } from "./SplitHandlers";

function onEdgesDelete(
  edges: Edge[],
  sendMessage: SendMessage,
  addReqNeedingLayout: (reqId: string) => void
) {
  for (let edge of edges) {
    const reqId = uuidv4();
    const pipeDelReq: PipeDelReq = {
      type: "PipeDel",
      reqId: reqId,
      pipeId: edge.id,
    };
    addReqNeedingLayout(reqId);
    sendMessage(JSON.stringify(pipeDelReq));
  }
}

function onConnect(connection: Connection, setTempEdge: Dispatch<SetStateAction<Edge|null>>, setEdges: Dispatch<SetStateAction<Edge[]>>) {
  if (!connection.source || !connection.target) return;
  
  const tempEdge: Edge = {
    id: uuidv4(),
    type: "temp",
    source: connection.source,
    target: connection.target,
    markerEnd: {
      type: MarkerType.Arrow,
      width: 15,
      height: 15,
      color: "magenta"
    }
  };
  setEdges(edges => edges.concat([tempEdge]));
  setTempEdge(tempEdge);
}


function onEdgeUpdate(
  oldEdge: Edge,
  newConnection: Connection,
  sendMessage: SendMessage,
  addReqNeedingLayout: (reqId: string) => void
) {
  if (newConnection.source !== null && newConnection.target !== null) {
    const reqId = uuidv4();
    const pipeEditReq: PipeEditReq = {
      type: "PipeEdit",
      reqId: reqId,
      pipeId: oldEdge.id,
      edits: {
        from: newConnection.source,
        to: newConnection.target,
      }
    };
    addReqNeedingLayout(reqId);
    sendMessage(JSON.stringify(pipeEditReq));
  }
}

function onPipeUpdate(pipeId: PipeId, edits: Partial<Pipe>, sendMessage: SendMessage) {
  const pipeEditReq: PipeEditReq = {
    type: "PipeEdit",
    reqId: uuidv4(),
    pipeId: pipeId,
    edits: edits,
  };
  sendMessage(JSON.stringify(pipeEditReq));
}

function onGroupUpdate(groupId: GroupId, edits: Partial<Group>, sendMessage: SendMessage) {
  const groupEditReq: GroupEditReq = {
    type: "GroupEdit",
    reqId: uuidv4(),
    groupId: groupId,
    edits: edits,
  };
  sendMessage(JSON.stringify(groupEditReq));
}

function onMachineUpdate(machineId: MachineId, edits: Partial<Machine>, sendMessage: SendMessage) {
  const machineEditReq: MachineEditReq = {
    type: "MachineEdit",
    reqId: uuidv4(),
    machineId: machineId,
    edits: edits,
  };
  sendMessage(JSON.stringify(machineEditReq));
}

function nodeIsCompatibleDropTarget(draggedNode: Node, targetNode: Node) {
  return (
    (draggedNode.type === "machine" && targetNode.type === "machine") ||
    (draggedNode.type === "slot-group" && targetNode.type === "slot-group" && draggedNode.parentId === targetNode.parentId)
  );
}

function onNodeDrag(
  mouseEvent: MouseEvent,
  draggedNode: Node,
  getIntersectingNodes: Instance.GetIntersectingNodes<any>,
  reactFlowInstance: (ReactFlowInstance | null),
  setDropTarget: (dropTarget: Node | null) => void
) {
  if (reactFlowInstance == null) {
    return;
  }

  const mousePosition = reactFlowInstance.screenToFlowPosition({
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
  });

  const intersections = getIntersectingNodes(boxToRect({
    x: mousePosition.x,
    x2: mousePosition.x+.1,
    y: mousePosition.y,
    y2: mousePosition.y+50 // the 50 lets it detect the machine node's header (containing it name and attached peripherals) that's not technically part of the node
  }))
    .filter(node => node.id !== draggedNode.id && nodeIsCompatibleDropTarget(draggedNode, node));

  let closestNode: Node | null = null;
  let closestDistance = Number.MAX_VALUE;
  for (let node of intersections) {
    if (node.positionAbsolute) {
      const dx = node.positionAbsolute.x - mousePosition.x;
      const dy = node.positionAbsolute.y - mousePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (closestDistance > distance) {
        closestDistance = distance;
        closestNode = node;
      }
    }
  }

 setDropTarget(closestNode);
}

/**
 * Get an edit message for updating a node's position
 * @param node Node with updated position
 * @returns Message to send to CC containing position edits
 */
function getEditMessageForNewPosition(node: Node) {
  if (node.type !== "machine" && node.type !== "slot-group") {
    throw new Error("Non-machine, non-group node was passed into getEditMessageForNewPosition!");
  }

  let nodeEditReq: MachineEditReq | GroupEditReq;
  const reqId = uuidv4();
  if (node.type === "machine") {
    nodeEditReq = {
      type: "MachineEdit",
      reqId: reqId,
      machineId: node.id,
      edits: {
        x: node.position.x,
        y: node.position.y,
      }
    };
  } else if (node.type === "slot-group") {
    nodeEditReq = {
      type: "GroupEdit",
      reqId: reqId,
      groupId: node.id,
      edits: {
        x: node.position.x,
        y: node.position.y,
      }
    }
  }

  return nodeEditReq!;
}

/**
 * Batched version of getEditMessageForNewPosition for editing lots of node
 * positions at once.
 * @param nodes Nodes with updated positions
 * @returns Message to send to CC containing position edits. If multiple nodes
 * were provided, this will be a BatchRequest containing edit messages for your
 * nodes. Otherwise, it will be just an edit message.
 */
function getBatchEditMessageForNewPositions(nodes: Node[]) {
  if (nodes.length === 1) {
    return getEditMessageForNewPosition(nodes[0]);
  }

  const batchReq: BatchRequest = {
    type: "BatchRequest",
    reqId: uuidv4(),
    requests: []
  };

  for (let node of nodes) {
    batchReq.requests.push(getEditMessageForNewPosition(node))
  }

  return batchReq;
}

function onNodeDragStop(
  mouseEvent: MouseEvent,
  draggedNode: Node,
  dropTarget: Node | null,
  clearDropTarget: () => void,
  sendMessage: SendMessage,
  reactFlowInstance: (ReactFlowInstance | null),
  factory: Factory,
  addReqNeedingLayout: (reqId: string) => void
) {
  if (!reactFlowInstance) return;

  if (dropTarget) {
    let messages: Request[] | undefined;
    if (draggedNode.type === "machine" && dropTarget.type === "machine") {
      messages = CombineHandlers.combineMachines([draggedNode.id], dropTarget.id, factory.machines, factory.groups);
    } else if (draggedNode.type === "slot-group" && dropTarget.type === "slot-group") {
      messages = CombineHandlers.combineGroups([draggedNode.id], dropTarget.id, factory.groups);
    }

    if (messages) {
      const reqId = uuidv4();
      const batchReq: BatchRequest = {
        type: "BatchRequest",
        reqId: reqId,
        requests: messages,
      };
      addReqNeedingLayout(reqId);
      sendMessage(JSON.stringify(batchReq));
    }

    clearDropTarget();
  } else if (draggedNode.type === "machine" || draggedNode.type === "slot-group") {
    // update xy position of node
    sendMessage(JSON.stringify(getEditMessageForNewPosition(draggedNode)));
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function onDrop(
  event: DragEvent,
  reactFlowInstance: (ReactFlowInstance | null),
  factory: Factory,
  sendMessage: SendMessage,
  addReqNeedingLayout: (reqId: string) => void
) {
  event.preventDefault();

  if (!reactFlowInstance) {
    return;
  }

  let requests: Request[] | undefined;

  const mousePosition = reactFlowInstance.screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  const intersections = reactFlowInstance.getIntersectingNodes(boxToRect({
    x: mousePosition.x,
    x2: mousePosition.x+.1,
    y: mousePosition.y,
    y2: mousePosition.y+.1
  }));

  const slotData = event.dataTransfer.getData("application/ccpipes-slotmove");

  if (slotData) {
    const { machineId } = JSON.parse(slotData);
    const parentMachine = reactFlowInstance.getNode(machineId);
    
    requests = splitSlotFromGroup(
      JSON.parse(slotData),
      intersections,
      factory,
      {x: mousePosition.x - parentMachine!.position.x, y: mousePosition.y - parentMachine!.position.y}
    );
  }

  const peripheralData = event.dataTransfer.getData("application/ccpipes-peripheralmove");
  if (peripheralData) {
    requests = splitPeripheralFromMachine(
      JSON.parse(peripheralData),
      intersections,
      factory,
      mousePosition
    );
  }

  if (requests && requests.length > 0) {
    const reqId = uuidv4();
    const batchReq: BatchRequest = {
      type: "BatchRequest",
      reqId: reqId,
      requests: requests,
    }
    addReqNeedingLayout(reqId);
    sendMessage(JSON.stringify(batchReq));
  }
}

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
  onEdgeUpdate: onEdgeUpdate,
  onConnect: onConnect,
  onPipeUpdate: onPipeUpdate,
  onGroupUpdate: onGroupUpdate,
  onMachineUpdate: onMachineUpdate,
  onNodeDrag: onNodeDrag,
  onNodeDragStop: onNodeDragStop,
  onDragOver: onDragOver,
  onDrop: onDrop,
  getBatchEditMessageForNewPositions: getBatchEditMessageForNewPositions,
}