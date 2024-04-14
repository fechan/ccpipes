import { PipeDelReq } from "@server/types/messages";
import { WebSocketMessage } from "react-use-websocket/dist/lib/types";
import { Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";

function onEdgesDelete(edges: Edge[], sendMessage: (message: WebSocketMessage) => void) {
  for (let edge of edges) {
    const pipeDelReq: PipeDelReq = {
      type: "PipeDel",
      reqId: uuidv4(),
      pipeId: edge.id,
    }
    sendMessage(JSON.stringify(pipeDelReq));
  }
}

export const GraphUpdateCallbacks = {
  onEdgesDelete: onEdgesDelete,
}