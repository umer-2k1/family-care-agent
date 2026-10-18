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
  console.info(`[voice] Request started threadId=${threadId} mimeType=${audio.type || "unknown"} sizeBytes=${audio.size}`);
  try {
    if (isDemoMode()) return Response.json({ transcript: "Emma developed a rash today.", ...runDemoCareAgent("Emma developed a rash today."), threadId, mode: "demo" });
    const transcript = await transcribeWithFallback(audio);
    const result = await invokeCareGraph(transcript, threadId);
    console.info(`[voice] Request completed threadId=${threadId} intent=${result.intent}`);
    return Response.json({ transcript, intent: result.intent, response: result.response, toolResult: result.toolResult, threadId, mode: "configured" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice processing failed.";
    console.error(`[voice] Request failed threadId=${threadId}: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
