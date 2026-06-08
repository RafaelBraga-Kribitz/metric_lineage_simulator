/**
 * React Flow canvas with bi-directional model sync, node drag, edge creation.
 */
"use client";

import type { MetricModelState } from "@/hooks/useMetricModel";
import type { MetricEdge } from "@/schema/types";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnEdgesDelete,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EdgeCreateDialog,
  type PendingConnection,
} from "./EdgeCreateDialog";
import { HypEdge } from "./HypEdge";
import { IdentityEdge } from "./IdentityEdge";
import { MetricNode } from "./MetricNode";
import { ModeledEdge } from "./ModeledEdge";
import {
  modelToEdges,
  modelToNodes,
  type MetricEdgeData,
  type MetricNodeData,
} from "./modelToFlow";

const nodeTypes = { metricNode: MetricNode };
const edgeTypes = {
  identity: IdentityEdge,
  modeled: ModeledEdge,
  hypothesized: HypEdge,
};

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
  },
};

interface MetricCanvasProps {
  state: MetricModelState;
}

export function MetricCanvas({ state }: MetricCanvasProps) {
  const {
    model,
    setModel,
    values,
    baselineValues,
    selectedNodeId,
    setSelectedNodeId,
  } = state;

  const [pending, setPending] = useState<PendingConnection | null>(null);

  const flowNodes = useMemo(
    () => modelToNodes(model, values, baselineValues, selectedNodeId),
    [model, values, baselineValues, selectedNodeId],
  );
  const flowEdges = useMemo(() => modelToEdges(model), [model]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(modelToNodes(model, values, baselineValues, selectedNodeId));
    setEdges(modelToEdges(model));
  }, [model, values, baselineValues, selectedNodeId, setNodes, setEdges]);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      const n = node as Node<MetricNodeData>;
      setModel((m) => ({
        ...m,
        nodes: m.nodes.map((item) =>
          item.id === n.id
            ? { ...item, position: { x: n.position.x, y: n.position.y } }
            : item,
        ),
      }));
    },
    [setModel],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const n = node as Node<MetricNodeData>;
      setSelectedNodeId(n.id);
    },
    [setSelectedNodeId],
  );

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setPending({
      connection,
      childId: connection.source,
      parentId: connection.target,
    });
  }, []);

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (deleted) => {
      const toRemove = new Set(
        (deleted as Edge<MetricEdgeData>[]).map((e) => {
          const edge = e.data?.edge;
          return edge
            ? `${edge.parent}|${edge.child}|${edge.kind}`
            : e.id;
        }),
      );
      setModel((m) => ({
        ...m,
        edges: m.edges.filter(
          (e) => !toRemove.has(`${e.parent}|${e.child}|${e.kind}`),
        ),
      }));
    },
    [setModel],
  );

  const handleCreateEdge = useCallback(
    (edge: MetricEdge) => {
      setModel((m) => ({
        ...m,
        edges: [...m.edges, edge],
      }));
      setPending(null);
    },
    [setModel],
  );

  return (
    <>
      <div className="h-full w-full rounded-xl border border-border bg-bg-app">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Background color="var(--color-border-subtle)" gap={16} />
          <Controls className="!bg-bg-panel !border-border !shadow-none [&>button]:!bg-bg-panel [&>button]:!border-border [&>button]:!text-text-muted" />
          <MiniMap
            className="!bg-bg-panel !border-border"
            nodeColor={() => "var(--color-bg-card)"}
          />
        </ReactFlow>
      </div>
      <EdgeCreateDialog
        pending={pending}
        onClose={() => setPending(null)}
        onCreate={handleCreateEdge}
      />
    </>
  );
}
