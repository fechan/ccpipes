import useWebSocket from "react-use-websocket";
import { ConfirmationResponse, FactoryGetReq, FactoryGetRes, FailResponse, Message, SuccessResponse } from "@server/types/messages";
import { v4 as uuidv4 } from "uuid";

import type { OnConnect } from "reactflow";

import { useCallback, useEffect, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";

import "reactflow/dist/style.css";

import { Factory } from "@server/types/core-types";
import { nodeTypes, getNodesForFactory } from "./nodes";
import { edgeTypes, getEdgesForFactory } from "./edges";

import { NewSessionModal } from "./components/NewSessionModal";

export default function App() {
  const [ socketUrl, setSocketUrl ] = useState("ws://localhost:3000");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [ showNewSessionModal, setShowNewSessionModal ] = useState(true);

  const [ factory, setFactory ] = useState({} as Factory);
  const [nodes, setNodes , onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

  useEffect(() => {
    setNodes(getNodesForFactory(factory));
    setEdges(getEdgesForFactory(factory));
  }, [factory]);

  useEffect(() => {
    if (lastMessage !== null && typeof lastMessage.data === "string") {
      const message: Message = JSON.parse(lastMessage.data as string);
      
      if (message.type === "ConfirmationResponse") {
        if ((message as ConfirmationResponse).ok) {
          const successRes = message as SuccessResponse;

          if (successRes.respondingTo === "SessionJoin") {
            setShowNewSessionModal(false);
            const factoryGetReq: FactoryGetReq = {
              type: "FactoryGet",
              reqId: uuidv4(),
            };
            sendMessage(JSON.stringify(factoryGetReq));
            return;
          }

          if (successRes.respondingTo === "FactoryGet") {
            const factoryGetRes = message as FactoryGetRes;
            setFactory(factoryGetRes.factory);
            return;
          }
        } else {
          const failRes = message as FailResponse;

          if (failRes.respondingTo === "SessionJoin") {
            alert("Error joining session: " + (failRes.message || "Unknown reason"));
          }
        }
      }

    }
  }, [lastMessage]);

  return (
    <div className="w-full h-full">
      { showNewSessionModal && <NewSessionModal sendMessage={ sendMessage } /> }

      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
