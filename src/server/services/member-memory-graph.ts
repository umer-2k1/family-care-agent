import { getMemoryProvider } from "@/lib/memory";
import { normalizeCogneeGraph, normalizeMemoryGraph, type MemoryGraphData } from "@/lib/memory/graph";
import { requireCareContext } from "@/server/auth/require-care-context";
import { getFamilyMember } from "@/server/repositories/family-members";
import { listMemberMemories } from "@/server/repositories/memory";

export type MemberMemoryGraph = MemoryGraphData & {
  source: "cognee" | "postgres_fallback" | "demo_seed";
  degraded: boolean;
  message?: string;
};

export async function getMemberMemoryGraph(memberId: string): Promise<MemberMemoryGraph> {
  const [context, member] = await Promise.all([requireCareContext(), getFamilyMember(memberId)]);
  if (!member) throw new Error("Family member not found.");

  if (!context.isDemo && (process.env.MEMORY_PROVIDER ?? "cognee") === "cognee") {
    try {
      const provider = getMemoryProvider();
      if (!provider.getGraph) throw new Error("The selected memory provider does not expose a knowledge graph.");
      const graph = normalizeCogneeGraph(await provider.getGraph(memberId));
      if (graph.nodes.length > 0) return { ...graph, source: "cognee", degraded: false };
      const memories = await listMemberMemories(memberId);
      return { ...normalizeMemoryGraph(member.id, member.name, memories), source: "postgres_fallback", degraded: true, message: "Cognee has not produced graph nodes for this member yet." };
    } catch (error) {
      const memories = await listMemberMemories(memberId);
      return { ...normalizeMemoryGraph(member.id, member.name, memories), source: "postgres_fallback", degraded: true, message: error instanceof Error ? error.message : "Cognee graph is unavailable." };
    }
  }

  const memories = await listMemberMemories(memberId);
  return {
    ...normalizeMemoryGraph(member.id, member.name, memories),
    source: context.isDemo ? "demo_seed" : "postgres_fallback",
    degraded: !context.isDemo,
    message: context.isDemo ? "Explicit local demo data." : "The selected memory provider does not expose a knowledge graph.",
  };
}
