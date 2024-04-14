import { PipeAddReq, PipeDelReq, PipeEditReq } from "@server/types/messages";
import { Dispatch, SetStateAction } from "react";
import { WebSocketMessage } from "react-use-websocket/dist/lib/types";
import { addEdge, Connection, Edge, updateEdge } from "reactflow";
import { v4 as uuidv4 } from "uuid";

type SendMessageFn = (message: WebSocketMessage) => void;

function onEdgesDelete(edges: Edge[], sendMessage: SendMessageFn) {
  for (let edge of edges) {
    const pipeDelReq: PipeDelReq = {
      type: "PipeDel",
      reqId: uuidv4(),
      pipeId: edge.id,
    };
    sendMessage(JSON.stringify(pipeDelReq));
  }
}

function onConnect(connection: Connection, sendMessage: SendMessageFn, setEdges: Dispatch<SetStateAction<Edge[]>>) {
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
    };

    return setEdges((edges) => addEdge(newEdge, edges));
  }
}

function onEdgeUpdate(oldEdge: Edge, newConnection: Connection, sendMessage: SendMessageFn, setEdges: Dispatch<SetStateAction<Edge[]>>) {
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

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
  onEdgeUpdate: onEdgeUpdate,
  onConnect: onConnect,
}