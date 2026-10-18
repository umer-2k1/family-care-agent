import { getIntegrationReadiness } from "@/lib/config/integration-readiness";

export async function GET() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const integrations = getIntegrationReadiness(process.env);
  const ready = demoMode || Object.values(integrations).every(Boolean);
  return Response.json({ status: ready ? "ok" : "configuration_required", mode: demoMode ? "demo" : "production", integrations }, { status: ready ? 200 : 503 });
}
