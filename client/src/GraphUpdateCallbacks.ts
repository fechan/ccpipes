import { Pipe, PipeId } from "@server/types/core-types";
import { PipeAddReq, PipeDelReq, PipeEditReq } from "@server/types/messages";
import { Dispatch, SetStateAction } from "react";
import { SendMessage } from "react-use-websocket/dist/lib/types";
import { addEdge, Connection, Edge, MarkerType, updateEdge } from "reactflow";
import { v4 as uuidv4 } from "uuid";

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

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
  onEdgeUpdate: onEdgeUpdate,
  onConnect: onConnect,
  onPipeUpdate: onPipeUpdate,
}