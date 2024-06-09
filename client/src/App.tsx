import { CcUpdatedFactory, ConfirmationResponse, FactoryGetReq, FactoryGetRes, FactoryUpdateRes, FailResponse, IdleTimeout, Message, SuccessResponse } from "@server/types/messages";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { v4 as uuidv4 } from "uuid";

import type { Edge, Node, NodeChange, NodeDragHandler, OnConnect, OnEdgesDelete, OnEdgeUpdateFunc, ReactFlowInstance } from "reactflow";

import { DragEvent, DragEventHandler, MouseEvent, useCallback, useEffect, useState } from "react";
import {
  Background,
  Controls, MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow
} from "reactflow";

import "reactflow/dist/style.css";

import { edgeTypes, getEdgesForFactory } from "./edges";
import { getNodesForFactory, nodeTypes } from "./nodes";

import { EdgeOptions } from "./components/EdgeOptions";
import { NewSessionModal } from "./components/NewSessionModal";
import { GraphUpdateCallbacks } from "./GraphUpdateCallbacks";
import { useDropTargetStore } from "./stores/dropTarget";
import { useFactoryStore } from "./stores/factory";
import { GroupOptions } from "./components/GroupOptions";
import { MachineOptions } from "./components/MachineOptions";
import { TempEdgeOptions } from "./components/TempEdgeOptions";
import { getLayoutedElements } from "./Layouting";
import toast, { Toaster } from "react-hot-toast";
import { Toast } from "./components/Toast";
import { MissingPeriphs } from "./components/MissingPeriphs";

const DEFAULT_ENDPOINT = (process.env.NODE_ENV === "production") ? "wss://sigils.fredchan.org" : "ws://localhost:3000";

export default function App() {
  const [ socketUrl, setSocketUrl ] = useState(DEFAULT_ENDPOINT);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });
  const [ showNewSessionModal, setShowNewSessionModal ] = useState(true);

  const { factory, version, setFactory, patchFactory } = useFactoryStore();

  const { getIntersectingNodes, getNode } = useReactFlow();
  const [ nodes, setNodes, onNodesChange ] = useNodesState([]);
  const [ edges, setEdges, onEdgesChange ] = useEdgesState([]);
  const [ reactFlowInstance, setReactFlowInstance ] = useState(null as (ReactFlowInstance<any, any> | null));

  const [ tempEdge, setTempEdge ] = useState(null as (Edge | null));

  const { dropTarget, setDropTarget, clearDropTarget } = useDropTargetStore();

  /**
   * Handlers for React Flow events
   */
  const onConnect: OnConnect = useCallback(
    (connection) => GraphUpdateCallbacks.onConnect(connection, setTempEdge, setEdges),
    [setEdges, setTempEdge]
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
    (event: DragEvent) => GraphUpdateCallbacks.onDrop(event, reactFlowInstance, sendMessage, factory),
    [reactFlowInstance, sendMessage, setNodes, factory]
  );

  const beforeNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes = changes.filter(change => change.type !== "remove" || !["slot-group", "machine"].includes(getNode(change.id)!.type!))
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  /**
   * End handlers for React Flow events
   */
  useEffect(() => {
    if (readyState === ReadyState.CLOSED)
      setShowNewSessionModal(true)
  }, [readyState])

  useEffect(() => {
    const nodes = getNodesForFactory(factory);
    const edges = getEdgesForFactory(factory);
    setEdges(edges);

    (async () => {
      const layouted = await getLayoutedElements(nodes, edges, factory);
      setNodes(layouted);
    })();
  }, [factory, version]);

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
            toast.custom((t) => <Toast
              toastObj={t}
              text={`Error joining session: ${failRes.message} (${failRes.error})`}
            />);
            return;
          }
          
          toast.custom((t) => <Toast
            toastObj={t}
            text={`Unexpected error: ${failRes.message} (${failRes.error})`}
          />);
          return;
        }
      } else if (message.type === "CcUpdatedFactory") {
        const ccUpdatedFactory = message as CcUpdatedFactory;
        patchFactory(ccUpdatedFactory.diff);
        return;
      } else if (message.type === "IdleTimeout") {
        const idleTimeout = message as IdleTimeout;
        toast.custom((t) => <Toast
          toastObj={t}
          text={`Disconnected due to idling: ${idleTimeout.message}`}
          showDismiss
        />, { duration: Infinity });
        return;
      }

    }
  }, [lastMessage]);

  return (
    <div className="w-full h-full">
      <Toaster />

      { showNewSessionModal && <NewSessionModal sendMessage={ sendMessage } /> }
      { tempEdge && <TempEdgeOptions
          sendMessage={ sendMessage }
          tempEdge={ tempEdge }
          setTempEdge={ setTempEdge }
          onCancel={ () => {
            setTempEdge(null);
            setEdges(edges.filter(edge => edge.type !== "temp"));
          } }
        />
      }

      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={beforeNodesChange}
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
          <GroupOptions sendMessage={ sendMessage } />
          <MachineOptions sendMessage={ sendMessage } />
        </Panel>
        <Panel position="top-left">
          <MissingPeriphs sendMessage={ sendMessage }/>
        </Panel>
        <Background className="bg-neutral-700" />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
