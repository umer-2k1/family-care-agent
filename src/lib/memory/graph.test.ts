import { describe, expect, it } from "vitest";
import { normalizeCogneeGraph, normalizeMemoryGraph } from "./graph";

describe("normalizeMemoryGraph", () => {
  it("keeps provenance on nodes", () => {
    const graph = normalizeMemoryGraph("emma", "Emma", [{ id: "rash", memberId: "emma", category: "episodic", text: "Rash reported", sourceType: "message", sourceId: "event-1", createdAt: "2026-09-06" }]);
    expect(graph.nodes[1]?.metadata?.sourceId).toBe("event-1");
    expect(graph.edges[0]?.relation).toBe("experienced");
  });
});

describe("normalizeCogneeGraph", () => {
  it("preserves real Cognee entities, relationships, and properties", () => {
    const graph = normalizeCogneeGraph({
      nodes: [
        { id: "emma", label: "Emma", type: "Person", properties: { age: 8 } },
        { id: "amoxicillin", label: "Amoxicillin", type: "Medication", properties: {} },
      ],
      edges: [{ source: "emma", target: "amoxicillin", label: "prescribed" }],
    });
    expect(graph.nodes).toEqual(expect.arrayContaining([expect.objectContaining({ id: "emma", type: "Person", metadata: expect.objectContaining({ provider: "cognee", age: 8 }) })]));
    expect(graph.edges[0]).toMatchObject({ source: "emma", target: "amoxicillin", relation: "prescribed" });
  });

  it("rejects malformed provider payloads", () => {
    expect(() => normalizeCogneeGraph({ nodes: "hardcoded", edges: [] })).toThrow();
  });
});
