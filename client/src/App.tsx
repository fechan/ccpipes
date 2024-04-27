import { ConfirmationResponse, FACTORY_UPDATE_REQUEST_TYPES, FactoryGetReq, FactoryGetRes, FactoryUpdateRes, FailResponse, Message, SuccessResponse } from "@server/types/messages";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { v4 as uuidv4 } from "uuid";

import type { Node, NodeDragHandler, OnConnect, OnEdgesDelete, OnEdgeUpdateFunc, ReactFlowInstance } from "reactflow";

import { DragEvent, DragEventHandler, MouseEvent, useCallback, useEffect, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow
} from "reactflow";

import "reactflow/dist/style.css";

import { edgeTypes, getEdgesForFactory, updateEdgesForFactory } from "./edges";
import { getNodesForFactory, nodeTypes, updateNodesForFactory } from "./nodes";

import { EdgeOptions } from "./components/EdgeOptions";
import { NewSessionModal } from "./components/NewSessionModal";
import { GraphUpdateCallbacks } from "./GraphUpdateCallbacks";
import { useDropTargetStore } from "./stores/dropTarget";
import { useFactoryStore } from "./stores/factory";

export default function App() {
  const [ socketUrl, setSocketUrl ] = useState("ws://localhost:3000");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });
  const [ showNewSessionModal, setShowNewSessionModal ] = useState(true);

  const { factory, addsAndDeletes, groupParents, setFactory, patchFactory } = useFactoryStore();

  const { getIntersectingNodes } = useReactFlow();
  const [ nodes, setNodes, onNodesChange ] = useNodesState([]);
  const [ edges, setEdges, onEdgesChange ] = useEdgesState([]);
  const [ reactFlowInstance, setReactFlowInstance ] = useState(null as (ReactFlowInstance<any, any> | null));

  const { dropTarget, setDropTarget, clearDropTarget } = useDropTargetStore();

  /**
   * Handlers for React Flow events
   */
  const onConnect: OnConnect = useCallback(
    (connection) => GraphUpdateCallbacks.onConnect(connection, sendMessage, setEdges),
    [setEdges]
  );

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (edges) => GraphUpdateCallbacks.onEdgesDelete(edges, sendMessage),
    [sendMessage]
  );

  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => GraphUpdateCallbacks.onEdgeUpdate(oldEdge, newConnection, sendMessage, setEdges),
    [sendMessage, setEdges]
  );

  const onNodeDrag: NodeDragHandler = useCallback(
    (mouseEvent: MouseEvent, node: Node) => GraphUpdateCallbacks.onNodeDrag(mouseEvent, node, getIntersectingNodes, reactFlowInstance, setDropTarget),
    [getIntersectingNodes, reactFlowInstance, setDropTarget]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (mouseEvent: MouseEvent, node: Node) => GraphUpdateCallbacks.onNodeDragStop(mouseEvent, node, dropTarget, clearDropTarget, sendMessage, reactFlowInstance, factory),
    [setNodes, clearDropTarget, dropTarget, sendMessage, reactFlowInstance, factory]
  );

  const onDragOver: DragEventHandler = useCallback(
    (event: DragEvent) => GraphUpdateCallbacks.onDragOver(event),
    []
  );

  const onDrop: DragEventHandler = useCallback(
    (event: DragEvent) => GraphUpdateCallbacks.onDrop(event, reactFlowInstance, sendMessage),
    [reactFlowInstance, sendMessage, setNodes]
  );

  /**
   * End handlers for React Flow events
   */

  useEffect(() => {
    setNodes(getNodesForFactory(factory));
    setEdges(getEdgesForFactory(factory));
  }, [factory]);

  useEffect(() => {
    if (
      addsAndDeletes.groups.adds.size > 0 ||
      addsAndDeletes.groups.deletes.size > 0 ||
      addsAndDeletes.machines.adds.size > 0 ||
      addsAndDeletes.machines.deletes.size > 0
    ) {
      setNodes(nodes => updateNodesForFactory(nodes, factory, addsAndDeletes, groupParents));
    }

    if (addsAndDeletes.pipes.adds.size > 0 || addsAndDeletes.pipes.deletes.size > 0) {
      setEdges(edges => updateEdgesForFactory(edges, factory, addsAndDeletes))
    }
  }, [addsAndDeletes])

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

          if ("diff" in successRes) {
            const factoryUpdateRes = successRes as FactoryUpdateRes;
            patchFactory(factoryUpdateRes.diff);
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
        onEdgeUpdate={onEdgeUpdate}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Panel position="top-right">
          <EdgeOptions sendMessage={ sendMessage } />
        </Panel>
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
