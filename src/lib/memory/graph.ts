import type { MemoryRecord } from "@/types/care";
import { z } from "zod";

export type MemoryGraphData = { nodes: Array<{ id: string; type: string; label: string; metadata?: Record<string, unknown> }>; edges: Array<{ id: string; source: string; target: string; relation: string }> };

const cogneeGraphSchema = z.object({
  nodes: z.array(z.object({ id: z.union([z.string(), z.number()]), label: z.string(), type: z.string(), properties: z.record(z.string(), z.unknown()).optional() })),
  edges: z.array(z.object({ source: z.union([z.string(), z.number()]), target: z.union([z.string(), z.number()]), label: z.string() })),
});

export function normalizeMemoryGraph(memberId: string, memberName: string, memories: MemoryRecord[]): MemoryGraphData {
  return {
    nodes: [{ id: memberId, type: "member", label: memberName }, ...memories.map((memory) => ({ id: memory.id, type: memory.category, label: memory.text, metadata: { sourceType: memory.sourceType, sourceId: memory.sourceId, createdAt: memory.createdAt, episodeId: memory.episodeId } }))],
    edges: memories.map((memory) => ({ id: `edge-${memory.id}`, source: memberId, target: memory.id, relation: memory.category === "episodic" ? "experienced" : "knows" })),
  };
}

export function normalizeCogneeGraph(payload: unknown): MemoryGraphData {
  const graph = cogneeGraphSchema.parse(payload);
  const nodes = graph.nodes.map((node) => ({ id: String(node.id), type: node.type, label: node.label, metadata: { provider: "cognee", ...(node.properties ?? {}) } }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges
    .map((edge, index) => ({ id: `cognee-edge-${index}-${String(edge.source)}-${String(edge.target)}`, source: String(edge.source), target: String(edge.target), relation: edge.label }))
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  return { nodes, edges };
}
