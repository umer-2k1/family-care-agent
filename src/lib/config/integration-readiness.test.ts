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
});
