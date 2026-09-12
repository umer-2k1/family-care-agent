import { afterEach, describe, expect, it, vi } from "vitest";
import { CogneeMemoryProvider } from "./cognee";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("CogneeMemoryProvider.getGraph", () => {
  it("resolves the member dataset and retrieves its knowledge graph", async () => {
    vi.stubEnv("COGNEE_API_URL", "https://cognee.example");
    vi.stubEnv("COGNEE_API_KEY", "secret");
    const graph = { nodes: [{ id: "1", label: "Emma", type: "Person", properties: {} }], edges: [] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "dataset-1", name: "family-member-emma" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(graph), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new CogneeMemoryProvider().getGraph("emma")).resolves.toEqual(graph);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://cognee.example/api/v1/datasets");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://cognee.example/api/v1/datasets/dataset-1/graph");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ headers: expect.objectContaining({ "X-Api-Key": "secret" }) });
  });

  it("returns an empty graph when the member dataset has not been cognified", async () => {
    vi.stubEnv("COGNEE_API_URL", "https://cognee.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })));
    await expect(new CogneeMemoryProvider().getGraph("new-member")).resolves.toEqual({ nodes: [], edges: [] });
  });
});

describe("CogneeMemoryProvider.addMemory", () => {
  it("uses Cognee's multipart add contract before cognifying the member dataset", async () => {
    vi.stubEnv("COGNEE_API_URL", "https://cognee.example");
    vi.stubEnv("COGNEE_API_KEY", "secret");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "completed" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new CogneeMemoryProvider().addMemory({ memberId: "emma", episodeId: "episode-1", category: "episodic", text: "Emma developed a rash.", sourceType: "message", sourceId: "event-1", createdAt: "2026-09-07" });

    const addOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://cognee.example/api/v1/add");
    expect(addOptions.body).toBeInstanceOf(FormData);
    expect((addOptions.body as FormData).get("datasetName")).toBe("family-member-emma");
    const uploaded = (addOptions.body as FormData).get("data");
    expect(uploaded).toBeInstanceOf(File);
    await expect((uploaded as File).text()).resolves.toBe("Emma developed a rash.");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://cognee.example/api/v1/cognify");
    expect(JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toMatchObject({ datasets: ["family-member-emma"], runInBackground: false });
  });
});
