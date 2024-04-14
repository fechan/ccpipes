import useWebSocket, { ReadyState } from "react-use-websocket";
import { ConfirmationResponse, FactoryGetReq, FactoryGetRes, FailResponse, Message, PipeAddReq, SuccessResponse } from "@server/types/messages";
import { v4 as uuidv4 } from "uuid";

import type { Edge, OnConnect, OnEdgesDelete } from "reactflow";

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
import { GraphUpdateCallbacks } from "./GraphUpdateCallbacks";

export default function App() {
  const [ socketUrl, setSocketUrl ] = useState("ws://localhost:3000");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [ showNewSessionModal, setShowNewSessionModal ] = useState(true);

  const [ factory, setFactory ] = useState({pipes: {}, machines: {}, groups: {}} as Factory);
  const [nodes, setNodes , onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect: OnConnect = useCallback(
    (connection) => {
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

    },
    [setEdges, factory]
  );

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (edges) => GraphUpdateCallbacks.onEdgesDelete(edges, sendMessage), []);

  useEffect(() => {
    setNodes(getNodesForFactory(factory));
    setEdges(getEdgesForFactory(factory));
  }, [factory]);

  useEffect(() => {
    if (readyState === ReadyState.CLOSED)
      setShowNewSessionModal(true)
  }, [readyState])

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
        onEdgesDelete={onEdgesDelete}
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
