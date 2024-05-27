import { Factory, Group, GroupId, Machine, MachineId, Pipe, PipeId } from "@server/types/core-types";
import { BatchRequest, GroupEditReq, MachineEditReq, PipeDelReq, PipeEditReq, Request } from "@server/types/messages";
import { Dispatch, DragEvent, MouseEvent, SetStateAction } from "react";
import { SendMessage } from "react-use-websocket/dist/lib/types";
import { boxToRect, Connection, Edge, Instance, MarkerType, Node, ReactFlowInstance } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { CombineHandlers } from "./CombineHandlers";
import { splitPeripheralFromMachine, splitSlotFromGroup } from "./SplitHandlers";

function onEdgesDelete(edges: Edge[], sendMessage: SendMessage) {
  for (let edge of edges) {
    const pipeDelReq: PipeDelReq = {
      type: "PipeDel",
      reqId: uuidv4(),
      pipeId: edge.id,
    };
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

function onEdgeUpdate(oldEdge: Edge, newConnection: Connection, sendMessage: SendMessage, setEdges: Dispatch<SetStateAction<Edge[]>>) {
  if (newConnection.source !== null && newConnection.target !== null) {
    const pipeEditReq: PipeEditReq = {
      type: "PipeEdit",
      reqId: uuidv4(),
      pipeId: oldEdge.id,
      edits: {
        from: newConnection.source,
        to: newConnection.target,
      }
    };
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

  // Get nodes that are under the mouse cursor AND are not the dragged node AND are compatible drop targets
  // For the mouse checking, there's probably a dedicated function for it but I don't know what it is
  const intersections = getIntersectingNodes(boxToRect({
    x: mousePosition.x,
    x2: mousePosition.x+.1,
    y: mousePosition.y,
    y2: mousePosition.y+.1
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

function onNodeDragStop(
  mouseEvent: MouseEvent,
  draggedNode: Node,
  dropTarget: Node | null,
  clearDropTarget: () => void,
  sendMessage: SendMessage,
  reactFlowInstance: (ReactFlowInstance | null),
  factory: Factory
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
      const batchReq: BatchRequest = {
        type: "BatchRequest",
        reqId: uuidv4(),
        requests: messages,
      };
      sendMessage(JSON.stringify(batchReq));
    }

    clearDropTarget();
  } else if (draggedNode.type === "machine" || draggedNode.type === "slot-group") {
    // update node x/y

    let nodeEditReq: MachineEditReq | GroupEditReq;
    if (draggedNode.type === "machine") {
      nodeEditReq = {
        type: "MachineEdit",
        reqId: uuidv4(),
        machineId: draggedNode.id,
        edits: {
          x: draggedNode.position.x,
          y: draggedNode.position.y,
        }
      };
    } else if (draggedNode.type === "slot-group") {
      nodeEditReq = {
        type: "GroupEdit",
        reqId: uuidv4(),
        groupId: draggedNode.id,
        edits: {
          x: draggedNode.position.x,
          y: draggedNode.position.y,
        }
      }
    }

    sendMessage(JSON.stringify(nodeEditReq!));
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function onDrop(
  event: DragEvent,
  reactFlowInstance: (ReactFlowInstance | null),
  sendMessage: SendMessage,
  factory: Factory
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
    requests = splitSlotFromGroup(
      JSON.parse(slotData),
      intersections,
      factory
    );
  }

  const peripheralData = event.dataTransfer.getData("application/ccpipes-peripheralmove");
  if (peripheralData) {
    requests = splitPeripheralFromMachine(
      JSON.parse(peripheralData),
      intersections,
      factory,
    );
  }

  if (requests && requests.length > 0) {
    const batchReq: BatchRequest = {
      type: "BatchRequest",
      reqId: uuidv4(),
      requests: requests,
    }

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
}