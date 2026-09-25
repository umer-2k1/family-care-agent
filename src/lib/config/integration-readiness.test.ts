import { describe, expect, it } from "vitest";
import { getIntegrationReadiness } from "./integration-readiness";

describe("integration readiness", () => {
  it("rejects placeholder or mismatched provider configuration", () => {
    const readiness = getIntegrationReadiness({
      DEFAULT_LLM_PROVIDER: "gemini",
      DEFAULT_LLM_MODEL: "model",
      OPENROUTER_API_KEY: "wrong-provider-key",
      MEMORY_PROVIDER: "cognee",
      COGNEE_API_URL: "https://your-tenant.aws.cognee.ai",
    });
    expect(readiness.primaryModel).toBe(false);
    expect(readiness.memory).toBe(false);
    expect(readiness.proactive).toBe(false);
  });

  it("requires the scheduler secret and service role independently of user Supabase access", () => {
    const readiness = getIntegrationReadiness({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      CRON_SECRET: "cron",
    });
    expect(readiness.supabase).toBe(true);
    expect(readiness.proactive).toBe(true);
  });

  it("accepts a DeepSeek provider only when its server key is configured", () => {
    const base = {
      DEFAULT_LLM_PROVIDER: "deepseek",
      DEFAULT_LLM_MODEL: "deepseek-flash",
      RECORD_LLM_PROVIDER: "deepseek",
      RECORD_LLM_MODEL: "deepseek-flash",
      FAST_LLM_PROVIDER: "deepseek",
      FAST_LLM_MODEL: "deepseek-flash",
    };

    expect(getIntegrationReadiness(base).primaryModel).toBe(false);
    expect(getIntegrationReadiness({ ...base, DEEPSEEK_API_KEY: "key" }).primaryModel).toBe(true);
  });
});
