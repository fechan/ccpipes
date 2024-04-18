import { Pipe, PipeId } from "@server/types/core-types";
import { MachineDelReq, MachineEditReq, PipeAddReq, PipeDelReq, PipeEditReq } from "@server/types/messages";
import { Dispatch, MouseEvent, SetStateAction, useContext } from "react";
import { SendMessage } from "react-use-websocket/dist/lib/types";
import { addEdge, boxToRect, Connection, Edge, Instance, MarkerType, Node, ReactFlowInstance, updateEdge } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { DropTargetContext } from "./contexts/DropTargetContext";
import { CombineHandlers, CombineResult } from "./CombineHandlers";

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
  return draggedNode.type === "machine" && targetNode.type === "machine";
}

function onNodeDrag(
  mouseEvent: MouseEvent,
  draggedNode: Node,
  getIntersectingNodes: Instance.GetIntersectingNodes<any>,
  reactFlowInstance: (ReactFlowInstance | null),
  setDropTarget: Dispatch<SetStateAction<Node | null>>
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
  setDropTarget: Dispatch<SetStateAction<Node | null>>,
  sendMessage: SendMessage,
  reactFlowInstance: (ReactFlowInstance | null),
) {
  if (dropTarget && reactFlowInstance) {
    let combineResult: CombineResult | undefined;
    if (draggedNode.type === "machine" && dropTarget.type === "machine") {
      combineResult = CombineHandlers.combineMachines([draggedNode], dropTarget, reactFlowInstance.getNodes(), sendMessage);
    }

    if (combineResult) {
      for (let message of combineResult.messages) {
        sendMessage(JSON.stringify(message));
      }

      setNodes(() => combineResult.finalNodeState);
    }

    setDropTarget(null);
  }
}

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
  onEdgeUpdate: onEdgeUpdate,
  onConnect: onConnect,
  onPipeUpdate: onPipeUpdate,
  onNodeDrag: onNodeDrag,
  onNodeDragStop: onNodeDragStop,
}