"use client";

import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { MemoryGraphData } from "@/lib/memory/graph";
import "@xyflow/react/dist/style.css";

export function MemoryGraph({ graph }: { graph: MemoryGraphData }) {
  const nodes: Node[] = graph.nodes.map((node, index) => ({ id: node.id, position: index === 0 ? { x: 30, y: 170 } : { x: 270 + ((index - 1) % 2) * 300, y: Math.floor((index - 1) / 2) * 170 + 30 }, data: { label: node.label }, style: { background: node.type === "member" ? "#7B9A8E" : "#FFFFFF", color: node.type === "member" ? "white" : "#1F2B27", border: node.type === "member" ? 0 : "1px solid #E7E9E5", borderRadius: 16, padding: 12, width: 230 } }));
  const edges: Edge[] = graph.edges.map((edge) => ({ ...edge, label: edge.relation, animated: edge.relation === "experienced" }));
  return <div className="h-[480px] overflow-hidden rounded-3xl border border-border bg-surface shadow-card"><ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false}><Background color="#E7E9E5" gap={20}/><Controls showInteractive={false}/><MiniMap/></ReactFlow></div>;
}
