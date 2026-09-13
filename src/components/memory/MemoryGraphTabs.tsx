"use client";

import { useState } from "react";
import { MemoryGraph } from "@/components/memory/MemoryGraph";
import type { MemoryGraphData } from "@/lib/memory/graph";

type GraphView = { graph: MemoryGraphData; source: "cognee" | "postgres"; message?: string };

export function MemoryGraphTabs({ memory, knowledge }: { memory: GraphView; knowledge: GraphView }) {
  const [active, setActive] = useState<"memory" | "knowledge">("memory");
  const selected = active === "memory" ? memory : knowledge;
  return <section className="mt-7"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{active === "memory" ? "Memory graph" : "Knowledge graph"}</h2><p className="mt-1 text-sm text-muted-foreground">{active === "memory" ? "Stored memories and their family-member provenance." : "Entities and relationships extracted by Cognee."}</p></div><div role="tablist" aria-label="Graph type" className="flex rounded-xl bg-muted p-1"><button type="button" role="tab" aria-selected={active === "memory"} onClick={() => setActive("memory")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active === "memory" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Memory graph</button><button type="button" role="tab" aria-selected={active === "knowledge"} onClick={() => setActive("knowledge")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active === "knowledge" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Knowledge graph</button></div></div><p className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selected.source === "cognee" ? "bg-primary-soft text-primary-dark" : "bg-muted text-muted-foreground"}`}>Source: {selected.source === "cognee" ? "Cognee" : "Postgres memory records"}</p>{selected.message && <p className="mb-3 text-xs text-muted-foreground">{selected.message}</p>}<MemoryGraph graph={selected.graph}/></section>;
}
