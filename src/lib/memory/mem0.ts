import type { AddMemoryInput, MemoryProvider, SearchMemoryInput } from "./provider";
import type { MemoryRecord } from "@/types/care";

export class Mem0MemoryProvider implements MemoryProvider {
  private baseUrl = process.env.MEM0_API_URL?.replace(/\/$/, "") ?? "https://api.mem0.ai";
  private apiKey = process.env.MEM0_API_KEY;
  private headers() { if (!this.apiKey) throw new Error("MEM0_API_KEY is not configured."); return { authorization: `Token ${this.apiKey}`, "content-type": "application/json" }; }
  async addMemory(input: AddMemoryInput) {
    const response = await fetch(`${this.baseUrl}/v3/memories/add/`, { method: "POST", headers: this.headers(), body: JSON.stringify({ messages: [{ role: "user", content: input.text }], user_id: input.memberId, metadata: input, infer: false }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Mem0 add failed with ${response.status}.`);
    const payload = await response.json() as { event_id?: string };
    return { ...input, id: payload.event_id ?? crypto.randomUUID() };
  }
  async searchMemory(input: SearchMemoryInput): Promise<MemoryRecord[]> {
    const response = await fetch(`${this.baseUrl}/v3/memories/search/`, { method: "POST", headers: this.headers(), body: JSON.stringify({ query: input.query, user_id: input.memberId }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Mem0 search failed with ${response.status}.`);
    const payload = await response.json() as { results?: Array<{ id?: string; memory?: string; metadata?: Partial<MemoryRecord> }> };
    return (payload.results ?? []).map((item) => ({ id: item.id ?? crypto.randomUUID(), memberId: input.memberId, category: item.metadata?.category ?? "semantic", text: item.memory ?? "", sourceType: item.metadata?.sourceType ?? "message", sourceId: item.metadata?.sourceId ?? "mem0-search", createdAt: item.metadata?.createdAt ?? new Date().toISOString() }));
  }
  async updateMemory(input: MemoryRecord) {
    const response = await fetch(`${this.baseUrl}/v1/memories/${input.id}/`, { method: "PUT", headers: this.headers(), body: JSON.stringify({ text: input.text }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Mem0 update failed with ${response.status}.`);
    return input;
  }
}
