import { runDemoCareAgent } from "@/lib/ai/care-agent";
import { invokeCareGraph } from "@/lib/ai/langgraph/care-graph";
import { isDemoMode } from "@/lib/demo-mode";
import { transcribeWithFallback } from "@/lib/voice/provider";

export async function POST(request: Request) {
  const form = await request.formData();
  const audio = form.get("audio");
  const threadIdValue = form.get("threadId");
  const threadId = typeof threadIdValue === "string" ? threadIdValue : crypto.randomUUID();
  if (!(audio instanceof File) || audio.size === 0 || audio.size > 15 * 1024 * 1024) return Response.json({ error: "A voice recording up to 15 MB is required." }, { status: 400 });
  try {
    if (isDemoMode()) return Response.json({ transcript: "Emma developed a rash today.", ...runDemoCareAgent("Emma developed a rash today."), threadId, mode: "demo" });
    const transcript = await transcribeWithFallback(audio);
    const result = await invokeCareGraph(transcript, threadId);
    return Response.json({ transcript, intent: result.intent, response: result.response, toolResult: result.toolResult, threadId, mode: "configured" });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Voice processing failed." }, { status: 500 }); }
}
