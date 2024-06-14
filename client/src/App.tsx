import { CcUpdatedFactory, ConfirmationResponse, FactoryGetReq, FactoryGetRes, FactoryUpdateRes, FailResponse, IdleTimeout, Message, SessionJoinReq, SuccessResponse } from "@server/types/messages";
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
import { Attribution } from "./components/Attribution";
import { AvailablePeriphs } from "./components/AvailablePeriphs";

const DEFAULT_ENDPOINT = (process.env.NODE_ENV === "production") ? "wss://sigils.fredchan.org" : "ws://localhost:3000";

export default function App() {
  const [ socketUrl, setSocketUrl ] = useState(DEFAULT_ENDPOINT);
  const [ sessionId, setSessionId ] = useState("");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: 60000,
      interval: 45000,
    }
  });
  const [ showNewSessionModal, setShowNewSessionModal ] = useState(true);

  const { factory, version, setFactory, patchFactory } = useFactoryStore();

  
  // reqsNeedingLayout keys: Request IDs that, when fulfilled, should trigger graph layouting
  // values: Boolean that's true if the Request has been fulfilled
  type PendingRequests = {[requestId: string]: boolean};
  const [ reqsNeedingLayout, setReqsNeedingLayout ] = useState({} as PendingRequests);
  const addReqNeedingLayout = useCallback((reqId: string) => {
    setReqsNeedingLayout({...reqsNeedingLayout, [reqId]: true});
  }, [reqsNeedingLayout, setReqsNeedingLayout]);

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
    (edges) => GraphUpdateCallbacks.onEdgesDelete(edges, sendMessage, addReqNeedingLayout),
    [sendMessage, addReqNeedingLayout]
  );

  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => GraphUpdateCallbacks.onEdgeUpdate(oldEdge, newConnection, sendMessage, addReqNeedingLayout),
    [sendMessage, setEdges, addReqNeedingLayout]
  );

  const onNodeDrag: NodeDragHandler = useCallback(
    (mouseEvent: MouseEvent, node: Node) => GraphUpdateCallbacks.onNodeDrag(mouseEvent, node, getIntersectingNodes, reactFlowInstance, setDropTarget),
    [getIntersectingNodes, reactFlowInstance, setDropTarget]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (mouseEvent: MouseEvent, node: Node) => GraphUpdateCallbacks.onNodeDragStop(mouseEvent, node, dropTarget, clearDropTarget, sendMessage, reactFlowInstance, factory, addReqNeedingLayout),
    [setNodes, clearDropTarget, dropTarget, sendMessage, reactFlowInstance, factory, addReqNeedingLayout]
  );

  const onDragOver: DragEventHandler = useCallback(
    (event: DragEvent) => GraphUpdateCallbacks.onDragOver(event),
    []
  );

  const onDrop: DragEventHandler = useCallback(
    (event: DragEvent) => GraphUpdateCallbacks.onDrop(event, reactFlowInstance, factory, sendMessage, addReqNeedingLayout),
    [reactFlowInstance, factory, sendMessage, setNodes, addReqNeedingLayout]
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
    if (readyState === ReadyState.CLOSED) {
      console.log("got disconnected!", new Date().getTime())
      setShowNewSessionModal(true);
    } else if (readyState === ReadyState.OPEN && sessionId !== "") {
      console.log("got disconnected but trying to rejoin", new Date().getTime())
      const sessionJoinReq: SessionJoinReq = {
        type: "SessionJoin",
        reqId: uuidv4(),
        sessionId: sessionId,
      };
      sendMessage(JSON.stringify(sessionJoinReq));
    }
  }, [readyState])

  useEffect(() => {
    const edges = getEdgesForFactory(factory);
    setEdges(edges);

    // determine if we need layout and remove requests from reqsNeedingLayout
    // that have been fulfilled
    let needLayout = false;
    const unfulfilledReqs: PendingRequests = {};
    for (let [req, fulfilled] of Object.entries(reqsNeedingLayout)) {
      if (fulfilled) {
        needLayout = true;
      } else {
        unfulfilledReqs[req] = false;
      }
    }
    setReqsNeedingLayout(unfulfilledReqs);

    if (needLayout) {
      const nodes = getNodesForFactory(factory);
      (async () => {
        const {layoutedNodes, nodesWithChanges} = await getLayoutedElements(nodes, edges, factory);
        setNodes(layoutedNodes);
        if (nodesWithChanges.length > 0) {
          sendMessage(JSON.stringify(GraphUpdateCallbacks.getBatchEditMessageForNewPositions(nodesWithChanges)));
        }
      })();
    }
  }, [factory, version, sendMessage]);

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
            setReqsNeedingLayout({...reqsNeedingLayout, [factoryGetRes.reqId]: true});
            setFactory(factoryGetRes.factory);
            return;
          }

          if ("diff" in successRes) {
            const factoryUpdateRes = successRes as FactoryUpdateRes;
            if (factoryUpdateRes.respondingTo in reqsNeedingLayout) {
              setReqsNeedingLayout({...reqsNeedingLayout, [factoryUpdateRes.reqId]: true});
            }
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
        setReqsNeedingLayout({...reqsNeedingLayout, ["force-update-layout"]: true});
        // HACK: setTimeout makes sure setReqsNeedingLayout happens before patchFactory.
        // I have no idea why this is necessary, because the race condition doesn't happen
        // when I need to update both states in other situations, like after receiving
        // a FactoryUpdateRes
        setTimeout(() => patchFactory(ccUpdatedFactory.diff), 100);
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

      { showNewSessionModal && <NewSessionModal
          sendMessage={ sendMessage }
          addReqNeedingLayout={ addReqNeedingLayout }
          sessionId={sessionId}
          setSessionId={setSessionId}
        />
      }
      { tempEdge && <TempEdgeOptions
          addReqNeedingLayout={ addReqNeedingLayout }
          sendMessage={ sendMessage }
          setTempEdge={ setTempEdge }
          tempEdge={ tempEdge }
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
        proOptions={{hideAttribution: true}} // Attribution is provided with the Attribution component instead
        fitView
      >
        <Panel position="top-right">
          <EdgeOptions
            sendMessage={ sendMessage }
            addReqNeedingLayout={ addReqNeedingLayout }
          />
          <GroupOptions sendMessage={ sendMessage } />
          <MachineOptions sendMessage={ sendMessage } />
        </Panel>
        <Panel position="top-left">
          <MissingPeriphs
            sendMessage={ sendMessage }
            addReqNeedingLayout={addReqNeedingLayout}
          />
          <AvailablePeriphs />
        </Panel>
        <Panel position="bottom-left" className="ms-16"><Attribution/></Panel>
        <Background className="bg-neutral-700" />
        <MiniMap
          pannable={ true }
          zoomable={ true }
          zoomStep={ 1 }
          ariaLabel="Minimap of your factory's machines"
          className="mcui-window rounded"
          nodeColor="#555555"
        />
        <Controls className="mcui-window rounded"/>
      </ReactFlow>
    </div>
  );
}
