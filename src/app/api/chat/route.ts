import { invokeCareGraph } from "@/lib/ai/langgraph/care-graph";
import { runDemoCareAgent } from "@/lib/ai/care-agent";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { z } from "zod";

const requestSchema = z.object({ message: z.string().trim().min(1).max(4000), threadId: z.string().min(1).max(200).optional() });

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) return Response.json({ error: "A message is required." }, { status: 400 });
  const threadId = payload.data.threadId ?? crypto.randomUUID();
  try {
    if (isDemoMode()) return Response.json({ ...runDemoCareAgent(payload.data.message), threadId, mode: "demo" });
    const context = await requireCareContext();
    const supabase = await createSupabaseServerClient();
    await supabase.from("agent_threads").upsert({ user_id: context.userId, family_id: context.familyId, langgraph_thread_id: threadId, updated_at: new Date().toISOString() }, { onConflict: "user_id,family_id,langgraph_thread_id" });
    const result = await invokeCareGraph(payload.data.message, threadId);
    return Response.json({ intent: result.intent, response: result.response, toolResult: result.toolResult, threadId, mode: "configured" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The care assistant is unavailable." }, { status: 500 });
  }
}
