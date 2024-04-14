import { PipeAddReq, PipeDelReq } from "@server/types/messages";
import { Dispatch, SetStateAction } from "react";
import { WebSocketMessage } from "react-use-websocket/dist/lib/types";
import { addEdge, Connection, Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";

type SendMessageFn = (message: WebSocketMessage) => void;

function onEdgesDelete(edges: Edge[], sendMessage: SendMessageFn) {
  for (let edge of edges) {
    const pipeDelReq: PipeDelReq = {
      type: "PipeDel",
      reqId: uuidv4(),
      pipeId: edge.id,
    }
    sendMessage(JSON.stringify(pipeDelReq));
  }
}

function onConnect(connection: Connection, sendMessage: SendMessageFn, setEdges: Dispatch<SetStateAction<Edge[]>> ) {
  if (connection.source && connection.target) {
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
      source: connection.source!,
      target: connection.target!,
      id: pipeId,
    };

    return setEdges((edges) => addEdge(newEdge, edges));
  }
}

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
  onConnect: onConnect,
}