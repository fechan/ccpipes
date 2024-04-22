import { Group, MachineId, Pipe, PipeId, Slot } from "@server/types/core-types";
import { BatchRequest, GroupAddReq, GroupEditReq, PipeAddReq, PipeDelReq, PipeEditReq } from "@server/types/messages";
import { Dispatch, DragEvent, MouseEvent, SetStateAction } from "react";
import { SendMessage } from "react-use-websocket/dist/lib/types";
import { addEdge, boxToRect, Connection, Edge, Instance, MarkerType, Node, ReactFlowInstance, updateEdge, useUpdateNodeInternals } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { CombineHandlers, CombineResult } from "./CombineHandlers";
import { ItemSlotDragData } from "./components/ItemSlot";

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

function onConnect(connection: Connection, sendMessage: SendMessage, setEdges: Dispatch<SetStateAction<Edge[]>>) {
  if (connection.source !== null && connection.target !== null) {
    const pipeId = uuidv4();

    const pipeAddReq: PipeAddReq = {
      type: "PipeAdd",
      reqId: uuidv4(),
      pipe: {
        id: pipeId,
        from: connection.source,
        to: connection.target,
      }
    };
    sendMessage(JSON.stringify(pipeAddReq));

    const newEdge: Edge = {
      source: connection.source,
      target: connection.target,
      id: pipeId,
      type: "pipe",
      markerEnd: {
        type: MarkerType.Arrow,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
      },
    };

    return setEdges((edges) => addEdge(newEdge, edges));
  }
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

    setEdges((els) => updateEdge(oldEdge, newConnection, els, { shouldReplaceId: false }))
  }
}

function onPipeUpdate(pipeId: PipeId, edits: Partial<Pipe>, sendMessage: SendMessage) {
  const pipeEditReq: PipeEditReq = {
    type: "PipeEdit",
    reqId: uuidv4(),
    pipeId: pipeId,
    edits: edits,
  }
  sendMessage(JSON.stringify(pipeEditReq));
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
  setNodes: Dispatch<SetStateAction<Node[]>>,
  clearDropTarget: () => void,
  sendMessage: SendMessage,
  reactFlowInstance: (ReactFlowInstance | null),
) {
  if (dropTarget && reactFlowInstance) {
    let combineResult: CombineResult | undefined;
    if (draggedNode.type === "machine" && dropTarget.type === "machine") {
      combineResult = CombineHandlers.combineMachines([draggedNode], dropTarget, reactFlowInstance.getNodes());
    } else if (draggedNode.type === "slot-group" && dropTarget.type === "slot-group") {
      combineResult = CombineHandlers.combineGroups([draggedNode], dropTarget, reactFlowInstance.getNodes());
    }

    if (combineResult) {
      const batchReq: BatchRequest = {
        type: "BatchRequest",
        reqId: uuidv4(),
        requests: combineResult.messages,
      };
      sendMessage(JSON.stringify(batchReq));

      setNodes(() => combineResult.finalNodeState);
    }

    clearDropTarget();
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
  setNodes: Dispatch<SetStateAction<Node[]>>,
) {
  event.preventDefault();
  const slotData = event.dataTransfer.getData("application/ccpipes-slotmove");
  
  if (slotData === undefined || !slotData || reactFlowInstance === undefined || !reactFlowInstance) {
    return;
  }

  const { slot, machineId, oldGroupId }: ItemSlotDragData = JSON.parse(slotData);

  const mousePosition = reactFlowInstance.screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  // check if we're over a machine node of the same ID as machineId
  const intersections = reactFlowInstance.getIntersectingNodes(boxToRect({
    x: mousePosition.x,
    x2: mousePosition.x+.1,
    y: mousePosition.y,
    y2: mousePosition.y+.1
  })).filter(node => node.id === machineId);

  // if yes we'll create a new group inside that node with just this slot in it
  // and remove this slot from its old group
  if (intersections.length > 0) {
    const machineNode = intersections[0];

    const newGroupId = uuidv4();
    const newGroup: Group = {
      id: newGroupId,
      slots: [slot],
      distribution: "roundrobin",
    };
    const groupAddReq: GroupAddReq = {
      type: "GroupAdd",
      reqId: uuidv4(),
      machineId: machineId,
      group: newGroup
    };

    const oldGroup = reactFlowInstance.getNode(oldGroupId);
    const oldGroupSlots = oldGroup?.data.group.slots;
    const oldGroupSlotsUpdated = oldGroupSlots.filter((oldSlot: Slot) => oldSlot.periphId !== slot.periphId || oldSlot.slot !== slot.slot);
    const groupEditReq: GroupEditReq = {
      type: "GroupEdit",
      reqId: uuidv4(),
      groupId: oldGroupId,
      edits: { slots: oldGroupSlotsUpdated }
    }

    const batchReq: BatchRequest = {
      type: "BatchRequest",
      reqId: uuidv4(),
      requests: [groupAddReq, groupEditReq],
    }

    sendMessage(JSON.stringify(batchReq));
    // setNodes(nodes => nodes
    //   .map(node => {
    //     if (node.id === oldGroupId) {
    //       const updatedGroup = {...node};
    //       updatedGroup.data.group.slots = oldGroupSlotsUpdated;
    //       return updatedGroup;
    //     }
    //     return node;
    //   })
    //   .concat({
    //     id: newGroupId,
    //     type: "slot-group",
    //     position: { x: mousePosition.x - machineNode.position.x, y: mousePosition.y - machineNode.position.y },
    //     data: {
    //       group: newGroup,
    //       parentId: machineId,
    //     },
    //     parentId: machineId,
    //     extent: "parent",
    //   }))
  }  
}

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
  onEdgeUpdate: onEdgeUpdate,
  onConnect: onConnect,
  onPipeUpdate: onPipeUpdate,
  onNodeDrag: onNodeDrag,
  onNodeDragStop: onNodeDragStop,
  onDragOver: onDragOver,
  onDrop: onDrop,
}