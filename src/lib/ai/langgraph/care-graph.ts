import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { completeWithFallback } from "@/lib/ai/models/provider";
import { getMemoryProvider } from "@/lib/memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { getActiveCareDashboard } from "@/server/repositories/care";
import { writeMemorySafely } from "@/server/services/memory";
import type { CareIntent } from "@/types/care";
import { z } from "zod";
import { findMentionedCaregiver, requestedDoseStatus, selectRequestedDose } from "@/lib/care/dose-selection";

const intentSchema = z.object({ intent: z.enum(["ask_question", "mark_dose", "add_health_event", "create_follow_up", "calendar_action", "prepare_summary", "family_member_action", "unknown"]) });
const CareState = Annotation.Root({ input: Annotation<string>, threadId: Annotation<string>, memberId: Annotation<string>, userId: Annotation<string>, familyId: Annotation<string>, context: Annotation<string>, intent: Annotation<CareIntent>, toolResult: Annotation<string>, response: Annotation<string> });

async function loadContext(state: typeof CareState.State) {
  const auth = await requireCareContext();
  const care = await getActiveCareDashboard();
  let memories = "";
  let records: unknown[] = [];
  let events: unknown[] = [];
  let familyMembers: unknown[] = [];
  if (care && !auth.isDemo) {
    const supabase = await createSupabaseServerClient();
    const [recordResult, eventResult, memoryReferenceResult, memberResult] = await Promise.all([
      supabase.from("health_records").select("id,record_type,status,raw_ai_output_json,confirmed_at").eq("family_member_id", care.memberId).order("created_at", { ascending: false }).limit(5),
      supabase.from("health_events").select("id,event_type,title,description,occurred_at,source_type").eq("family_member_id", care.memberId).order("occurred_at", { ascending: false }).limit(20),
      supabase.from("memory_references").select("content,category,source_type,source_id,created_at").eq("family_member_id", care.memberId).order("created_at", { ascending: false }).limit(20),
      supabase.from("family_members").select("id,name,relationship").eq("family_id", auth.familyId),
    ]);
    records = recordResult.data ?? [];
    events = eventResult.data ?? [];
    familyMembers = memberResult.data ?? [];
    const persistedMemories = (memoryReferenceResult.data ?? []).map((memory) => memory.content);
    try {
      const providerMemories = await getMemoryProvider().searchMemory({ memberId: care.memberId, query: state.input });
      memories = [...persistedMemories, ...providerMemories.map((memory) => memory.text)].join("\n");
    } catch {
      memories = persistedMemories.join("\n");
    }
  }
  return { userId: auth.userId, familyId: auth.familyId, memberId: care?.memberId ?? "", context: JSON.stringify({ care, records, events, memories, familyMembers }) };
}

async function understandIntent(state: typeof CareState.State) {
  const output = await completeWithFallback("reasoning", { prompt: `Classify this family-care message. Return JSON with one intent from ask_question, mark_dose, add_health_event, create_follow_up, calendar_action, prepare_summary, family_member_action, unknown. Message: ${state.input}`, json: true });
  return { intent: intentSchema.parse(JSON.parse(output)).intent };
}

async function executeTool(state: typeof CareState.State) {
  const care = JSON.parse(state.context) as { care: Awaited<ReturnType<typeof getActiveCareDashboard>>; familyMembers: Array<{ id: string; name: string; relationship: string }> };
  if (!care.care) return { toolResult: "No active care episode exists." };
  const auth = await requireCareContext();
  if (state.intent === "prepare_summary" || state.intent === "ask_question") return { toolResult: state.context };
  if (state.intent === "calendar_action") return { toolResult: `Confirmation required before adding follow-up ${care.care.followUp?.id ?? "unknown"} to Google Calendar.` };
  if (auth.isDemo) return { toolResult: `Demo action ${state.intent} completed for ${care.care.memberName}.` };
  const supabase = await createSupabaseServerClient();
  if (state.intent === "mark_dose") {
    const dose = selectRequestedDose(care.care.doses, state.input);
    if (!dose) return { toolResult: "No scheduled dose is available." };
    const status = requestedDoseStatus(state.input);
    const caregiver = findMentionedCaregiver(care.familyMembers, state.input);
    const { error } = await supabase.from("medication_doses").update({ status, taken_at: status === "taken" ? new Date().toISOString() : null, caregiver_user_id: auth.userId, caregiver_member_id: caregiver?.id ?? null }).eq("id", dose.id);
    if (error) throw error;
    await writeMemorySafely({ memberId: care.care.memberId, episodeId: care.care.episodeId, category: "episodic", text: state.input, sourceType: "care_action", sourceId: dose.id, createdAt: new Date().toISOString() });
    return { toolResult: `Dose ${dose.id} was marked ${status}${caregiver ? ` by ${caregiver.name}` : ""}.` };
  }
  if (state.intent === "add_health_event") {
    const { data, error } = await supabase.from("health_events").insert({ family_member_id: care.care.memberId, care_episode_id: care.care.episodeId, event_type: "parent_reported", title: "Health update", description: state.input, occurred_at: new Date().toISOString(), source_type: "chat", reported_by_user_id: auth.userId }).select("id").single();
    if (error) throw error;
    await writeMemorySafely({ memberId: care.care.memberId, episodeId: care.care.episodeId, category: "episodic", text: state.input, sourceType: "message", sourceId: data.id, createdAt: new Date().toISOString() });
    return { toolResult: `Health event ${data.id} was created as parent-reported.` };
  }
  return { toolResult: "No state-changing tool ran because the request needs clarification or confirmation." };
}

async function generateResponse(state: typeof CareState.State) {
  const purpose = state.intent === "prepare_summary" ? "summary" : "chat";
  const response = await completeWithFallback(purpose, { prompt: `You are Care Memory, a family care coordination assistant. Never diagnose. Be concise and distinguish parent-reported from document-derived facts. User message: ${state.input}\nIntent: ${state.intent}\nContext: ${state.context}\nTool result: ${state.toolResult}` });
  return { response };
}

const careGraph = new StateGraph(CareState).addNode("loadContext", loadContext).addNode("understandIntent", understandIntent).addNode("executeTool", executeTool).addNode("generateResponse", generateResponse).addEdge(START, "loadContext").addEdge("loadContext", "understandIntent").addEdge("understandIntent", "executeTool").addEdge("executeTool", "generateResponse").addEdge("generateResponse", END).compile();

export async function invokeCareGraph(input: string, threadId: string) {
  return careGraph.invoke({ input, threadId });
}
