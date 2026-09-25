import { afterEach, describe, expect, it, vi } from "vitest";
import { completeWithFallback } from "./provider";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("completeWithFallback", () => {
  it("uses the configured fallback when the primary provider is unavailable", async () => {
    vi.stubEnv("DEFAULT_LLM_PROVIDER", "groq");
    vi.stubEnv("DEFAULT_LLM_MODEL", "primary-model");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("FALLBACK_LLM_PROVIDER", "openrouter");
    vi.stubEnv("FALLBACK_LLM_MODEL", "fallback-model");
    vi.stubEnv("OPENROUTER_API_KEY", "fallback-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "fallback response" } }] }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(completeWithFallback("summary", { prompt: "summarize" })).resolves.toBe("fallback response");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("openrouter.ai");
  });

  it("sends DeepSeek requests to its OpenAI-compatible endpoint", async () => {
    vi.stubEnv("DEFAULT_LLM_PROVIDER", "deepseek");
    vi.stubEnv("DEFAULT_LLM_MODEL", "deepseek-flash");
    vi.stubEnv("DEEPSEEK_API_KEY", "deepseek-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "DeepSeek response" } }] }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(completeWithFallback("summary", { prompt: "summarize" })).resolves.toBe("DeepSeek response");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.deepseek.com/chat/completions");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: expect.objectContaining({ authorization: "Bearer deepseek-key" }) });
  });

  it("returns a bounded combined error when every provider fails", async () => {
    vi.stubEnv("DEFAULT_LLM_PROVIDER", "groq");
    vi.stubEnv("DEFAULT_LLM_MODEL", "primary-model");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("FALLBACK_LLM_PROVIDER", "openrouter");
    vi.stubEnv("FALLBACK_LLM_MODEL", "fallback-model");
    vi.stubEnv("OPENROUTER_API_KEY", "");

    await expect(completeWithFallback("reasoning", { prompt: "classify" })).rejects.toThrow("All model providers failed");
  });
});
