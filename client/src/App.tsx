import { ConfirmationResponse, FactoryGetReq, FactoryGetRes, FailResponse, Message, SuccessResponse } from "@server/types/messages";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { v4 as uuidv4 } from "uuid";

import type { Node, Edge, OnConnect, OnEdgesDelete, OnEdgeUpdateFunc } from "reactflow";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";

import { Factory } from "@server/types/core-types";
import { edgeTypes, getEdgesForFactory } from "./edges";
import { getNodesForFactory, nodeTypes } from "./nodes";

import { EdgeOptions } from "./components/EdgeOptions";
import { NewSessionModal } from "./components/NewSessionModal";
import { GraphUpdateCallbacks } from "./GraphUpdateCallbacks";

import ELK, { ElkExtendedEdge, ElkNode, LayoutOptions } from "elkjs";
const elk = new ELK();
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], options: LayoutOptions = {}) => {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: options,
    children: nodes
      .filter(node => node.parentId === undefined)
      .map((node) => ({
        ...node,
        // Adjust the target and source handle positions based on the layout
        // direction.
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',

        children: nodes
          .filter(group => group?.parentId === node.id)
          .map(group => {
            return {
              ...group,
              targetPosition: isHorizontal ? 'left' : 'top',
              sourcePosition: isHorizontal ? 'right' : 'bottom',
              width: 50,
              height: 50,
            }
          }),

        // Hardcode a width and height for elk to use when layouting.
        width: 50,
        height: 50,
      })),
    edges: edges.map(edge => {
      return {
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target]
      } as ElkExtendedEdge;
    }),
  };

  return elk
    .layout(graph)
    .then((layoutedGraph) => {
      console.log(layoutedGraph.children)
      const machines = layoutedGraph.children.map((node) => ({
        ...node,
        // React Flow expects a position property on the node instead of `x`
        // and `y` fields.
        position: { x: node.x, y: node.y },
        style: { width: node.width, height: node.height }
      }));
      const groups = [];
      for (const machine of machines) {
        groups.push(...machine.children.map((node) => ({
          ...node,
          position: { x: node.x, y: node.y },
          style: { width: node.width, height: node.height }
        }))
        );
      }
      return {
        nodes: [...machines, ...groups],

        edges: layoutedGraph.edges.map(edge => {
          return {
            id: edge.id,
            source: edge.sources[0],
            target: edge.targets[0],
            type: 'pipe',
        }
        }),
      }
    })
    .catch(console.error);
};

export default function App() {
  const [ socketUrl, setSocketUrl ] = useState("ws://localhost:3000");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });
  const [ showNewSessionModal, setShowNewSessionModal ] = useState(true);

  const [ factory, setFactory ] = useState({pipes: {}, machines: {}, groups: {}} as Factory);
  const [ nodes, setNodes, onNodesChange ] = useNodesState([]);
  const [ edges, setEdges, onEdgesChange ] = useEdgesState([]);
  const { fitView } = useReactFlow();

  /**
   * Handlers for React Flow events
   */
  const onConnect: OnConnect = useCallback(
    (connection) => GraphUpdateCallbacks.onConnect(connection, sendMessage, setEdges),
    [setEdges, factory]
  );

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (edges) => GraphUpdateCallbacks.onEdgesDelete(edges, sendMessage),
    []
  );

  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => GraphUpdateCallbacks.onEdgeUpdate(oldEdge, newConnection, sendMessage, setEdges),
    []
  );

  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = getNodesForFactory(factory);
      const es = getEdgesForFactory(factory);

      getLayoutedElements(ns, es, opts).then(({ nodes, edges }) => {
        setNodes(nodes);
        setEdges(edges);
        
        window.requestAnimationFrame(() => fitView());
      });
    },
    [nodes, edges]
  );

  useLayoutEffect(() => {
    onLayout({ direction: 'DOWN', useInitialNodes: true });
  }, []);

  /**
   * End handlers for React Flow events
   */

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
      { showNewSessionModal && <NewSessionModal
        sendMessage={ sendMessage }
      /> }

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
        fitView
      >
        <Panel position="top-right">
          <EdgeOptions
            sendMessage={ sendMessage }
            setEdges={ setEdges }
           />
        </Panel>

        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
