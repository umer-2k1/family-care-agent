import { AppShell } from "@/components/layout/AppShell";
import { MemoryGraph } from "@/components/memory/MemoryGraph";
import { listFamilyMembers } from "@/server/repositories/family-members";
import { listMemberMemories } from "@/server/repositories/memory";
import { getMemberMemoryGraph } from "@/server/services/member-memory-graph";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const members = await listFamilyMembers();
  const requestedMemberId = (await searchParams).member;
  const member = members.find((item) => item.id === requestedMemberId) ?? members[0];
  const [memories, graph] = member ? await Promise.all([listMemberMemories(member.id), getMemberMemoryGraph(member.id)]) : [[], { nodes: [], edges: [], source: "postgres_fallback" as const, degraded: true, message: "Add a family member to start building memory." }];
  return <AppShell activeItem="Memory"><div className="pb-20 lg:pb-0"><p className="text-sm font-medium text-primary-dark">{member?.name ?? "Family"}&apos;s long-term context</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Memory graph</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Configured Cognee mode renders the member&apos;s real knowledge-graph entities and relationships. Postgres provenance is used only when Cognee is unavailable.</p><p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${graph.source === "cognee" ? "bg-primary-soft text-primary-dark" : "bg-muted text-muted-foreground"}`}>Source: {graph.source === "cognee" ? "Cognee knowledge graph" : graph.source === "demo_seed" ? "Explicit demo seed" : "Postgres availability fallback"}</p>{graph.message && <p className="mt-2 text-xs text-muted-foreground">{graph.message}</p>}<nav aria-label="Choose family member" className="mt-5 flex flex-wrap gap-2">{members.map((option) => <Link key={option.id} href={`/memory?member=${option.id}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${option.id === member?.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{option.name}</Link>)}</nav><div className="mt-7"><MemoryGraph graph={graph}/></div><section className="mt-7 grid gap-4 md:grid-cols-2">{memories.map((memory) => <article key={memory.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card"><p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">{memory.category} · {memory.sourceType}</p><p className="mt-3 font-medium leading-6">{memory.text}</p><p className="mt-3 text-xs text-muted-foreground">Source: {memory.sourceId} · {memory.createdAt}</p></article>)}</section></div></AppShell>;
}
