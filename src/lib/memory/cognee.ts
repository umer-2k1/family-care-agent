import type { AddMemoryInput, MemoryProvider, SearchMemoryInput } from "./provider";
import type { MemoryRecord } from "@/types/care";

export class CogneeMemoryProvider implements MemoryProvider {
  private baseUrl = process.env.COGNEE_API_URL?.replace(/\/$/, "") ?? "https://api.cognee.ai";
  private apiKey = process.env.COGNEE_API_KEY;
  private authHeaders(): Record<string, string> { return this.apiKey ? { "X-Api-Key": this.apiKey } : {}; }
  private jsonHeaders(): Record<string, string> { return { "content-type": "application/json", ...this.authHeaders() }; }
  async addMemory(input: AddMemoryInput) {
    const datasetName = `family-member-${input.memberId}`;
    const form = new FormData();
    form.append("raw_data", input.text);
    form.set("datasetName", datasetName);
    form.set("labels", JSON.stringify([input.category]));
    form.set("external_metadata", JSON.stringify([{ familyMemberId: input.memberId, episodeId: input.episodeId ?? null, sourceType: input.sourceType, sourceId: input.sourceId, createdAt: input.createdAt }]));
    const add = await fetch(`${this.baseUrl}/api/v1/add`, { method: "POST", headers: this.authHeaders(), body: form, signal: AbortSignal.timeout(30000) });
    if (!add.ok) throw new Error(`Cognee add failed with ${add.status}.`);
    const cognify = await fetch(`${this.baseUrl}/api/v1/cognify`, { method: "POST", headers: this.jsonHeaders(), body: JSON.stringify({ datasets: [datasetName], run_in_background: false }), signal: AbortSignal.timeout(45000) });
    if (!cognify.ok) throw new Error(`Cognee cognify failed with ${cognify.status}.`);
    return { ...input, id: crypto.randomUUID() };
  }
  async searchMemory(input: SearchMemoryInput): Promise<MemoryRecord[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/search`, { method: "POST", headers: this.jsonHeaders(), body: JSON.stringify({ query: input.query, search_type: "CHUNKS", datasets: [`family-member-${input.memberId}`] }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Cognee search failed with ${response.status}.`);
    const payload = await response.json() as unknown;
    const items = Array.isArray(payload) ? payload : [];
    return items.map((item, index) => ({ id: `cognee-${index}`, memberId: input.memberId, category: "episodic", text: typeof item === "string" ? item : JSON.stringify(item), sourceType: "message", sourceId: "cognee-search", createdAt: new Date().toISOString() }));
  }
  async getGraph(memberId: string) {
    const datasetName = `family-member-${memberId}`;
    const datasetsResponse = await fetch(`${this.baseUrl}/api/v1/datasets`, { headers: this.authHeaders(), signal: AbortSignal.timeout(30000) });
    if (!datasetsResponse.ok) throw new Error(`Cognee datasets failed with ${datasetsResponse.status}.`);
    const datasets = await datasetsResponse.json() as Array<{ id?: string; name?: string }>;
    const dataset = Array.isArray(datasets) ? datasets.find((item) => item.name === datasetName) : undefined;
    if (!dataset?.id) return { nodes: [], edges: [] };
    const graphResponse = await fetch(`${this.baseUrl}/api/v1/datasets/${encodeURIComponent(dataset.id)}/graph`, { headers: this.authHeaders(), signal: AbortSignal.timeout(30000) });
    if (!graphResponse.ok) throw new Error(`Cognee graph failed with ${graphResponse.status}.`);
    return graphResponse.json();
  }
  async updateMemory(input: MemoryRecord) { return this.addMemory(input); }
}
