import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { completeWithFallback } from "@/lib/ai/models/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { whatsappThreadId } from "./whatsapp-thread";

const planSchema = z.object({
  intent: z.enum(["question", "record_dose", "health_event", "summary", "reminder", "unsafe_medication_change", "unknown"]),
  memberName: z.string().trim().min(1).max(120).nullable(),
  doseStatus: z.enum(["taken", "missed", "skipped"]).nullable(),
});

type Member = { id: string; name: string };
type Medication = {
  id: string;
  name: string;
  dose: number;
  unit: string;
  frequency_per_day: number;
  instructions: string | null;
  start_date: string;
  end_date: string;
  medication_doses: Array<{ id: string; status: string; scheduled_at: string; taken_at: string | null }>;
};
type CareContext = {
  member: Member;
  episodes: Array<{ id: string; title: string; status: string; start_date: string; end_date: string | null }>;
  medications: Medication[];
  records: Array<{ record_type: string; record_date: string | null; status: string; raw_ai_output_json: unknown; created_at: string }>;
  events: Array<{ title: string; description: string | null; occurred_at: string }>;
  followUps: Array<{ title: string; due_at: string; status: string }>;
  memories: Array<{ content: string; category: string; created_at: string }>;
  episodeId: string | null;
};

const WhatsAppCareState = Annotation.Root({
  input: Annotation<string>,
  senderId: Annotation<string>,
  threadId: Annotation<string>,
  connectionId: Annotation<string>,
  contextMessageId: Annotation<string | undefined>,
  userId: Annotation<string>,
  familyId: Annotation<string>,
  members: Annotation<Member[]>,
  conversation: Annotation<string>,
  intent: Annotation<z.infer<typeof planSchema>["intent"]>,
  requestedMemberName: Annotation<string | null>,
  doseStatus: Annotation<z.infer<typeof planSchema>["doseStatus"]>,
  context: Annotation<CareContext | null>,
  toolResult: Annotation<string>,
  response: Annotation<string>,
});

function parsePlan(value: string) {
  const json = value.replace(/^```(?:json)?\s*|\s*```$/g, "");
  return planSchema.safeParse(JSON.parse(json));
}

async function authorize(state: typeof WhatsAppCareState.State) {
  const supabase = createSupabaseAdminClient();
  const { data: connection, error } = await supabase
    .from("whatsapp_connections")
    .select("id,user_id,family_id")
    .eq("wa_id", state.senderId)
    .eq("status", "connected")
    .maybeSingle();
  if (error) throw error;
  if (!connection) return { toolResult: "This WhatsApp number is not connected to Care Memory." };
  const { data: members, error: memberError } = await supabase
    .from("family_members")
    .select("id,name")
    .eq("family_id", connection.family_id);
  if (memberError) throw memberError;
  const { data: messages, error: messageError } = await supabase
    .from("whatsapp_inbound_messages")
    .select("body,received_at")
    .eq("connection_id", connection.id)
    .order("received_at", { ascending: false })
    .limit(8);
  if (messageError) throw messageError;
  await supabase.from("agent_threads").upsert(
    {
      user_id: connection.user_id,
      family_id: connection.family_id,
      langgraph_thread_id: state.threadId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,family_id,langgraph_thread_id" },
  );
  return {
    userId: connection.user_id,
    familyId: connection.family_id,
    members: members ?? [],
    conversation: (messages ?? []).reverse().map((message) => message.body).join("\n"),
  };
}

async function plan(state: typeof WhatsAppCareState.State) {
  if (state.toolResult) return {};
  const output = await completeWithFallback("reasoning", {
    json: true,
    prompt: `You are the LangGraph planner for a family-care assistant. Return JSON only: {"intent":"question|record_dose|health_event|summary|reminder|unsafe_medication_change|unknown","memberName":"exact supplied family-member name or null","doseStatus":"taken|missed|skipped or null"}. Every incoming WhatsApp message is planned here. Use record_dose only when the caregiver is explicitly reporting a medication dose outcome, not when they ask about dose history or use words like taken in a question. Never diagnose. A request to stop, start, or change medication is unsafe_medication_change. A symptom or side effect the caregiver reports is health_event. A request for a doctor summary is summary. Family members: ${state.members.map((member) => member.name).join(", ")}. Recent conversation: ${state.conversation}. Latest message: ${state.input}`,
  });
  try {
    const parsed = parsePlan(output);
    if (parsed.success) return { intent: parsed.data.intent, requestedMemberName: parsed.data.memberName, doseStatus: parsed.data.doseStatus };
  } catch {
    // A safe clarification is preferable to acting on malformed model output.
  }
  return { intent: "unknown" as const, requestedMemberName: null, doseStatus: null };
}

async function loadMemberContext(state: typeof WhatsAppCareState.State) {
  if (state.toolResult) return {};
  if (state.intent === "record_dose") return {};
  const named = state.requestedMemberName?.toLocaleLowerCase();
  const matches = named
    ? state.members.filter((member) => member.name.toLocaleLowerCase() === named)
    : state.members.length === 1
      ? state.members
      : [];
  if (matches.length !== 1) {
    const choices = state.members.map((member) => member.name).join(", ");
    return { toolResult: choices ? `Please tell me which family member you mean: ${choices}.` : "No family members are available in this Care Memory account." };
  }
  const member = matches[0];
  const supabase = createSupabaseAdminClient();
  const [{ data: episodes, error: episodeError }, { data: records, error: recordError }, { data: events, error: eventError }, { data: followUps, error: followUpError }, { data: memories, error: memoryError }] = await Promise.all([
    supabase.from("care_episodes").select("id,title,status,start_date,end_date,medications(id,name,dose,unit,frequency_per_day,instructions,start_date,end_date,medication_doses(id,status,scheduled_at,taken_at))").eq("family_member_id", member.id).order("created_at", { ascending: false }),
    supabase.from("health_records").select("record_type,record_date,status,raw_ai_output_json,created_at").eq("family_id", state.familyId).eq("family_member_id", member.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("health_events").select("title,description,occurred_at").eq("family_member_id", member.id).order("occurred_at", { ascending: false }).limit(10),
    supabase.from("follow_ups").select("title,due_at,status").eq("family_member_id", member.id).order("due_at", { ascending: true }).limit(20),
    supabase.from("memory_references").select("content,category,created_at").eq("family_member_id", member.id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (episodeError) throw episodeError;
  if (recordError) throw recordError;
  if (eventError) throw eventError;
  if (followUpError) throw followUpError;
  if (memoryError) throw memoryError;
  const episodeRows = (episodes ?? []) as Array<{ id: string; title: string; status: string; start_date: string; end_date: string | null; medications: Medication[] | null }>;
  const activeEpisode = episodeRows.find((episode) => episode.status === "active");
  return { context: { member, episodes: episodeRows.map((episode) => ({ id: episode.id, title: episode.title, status: episode.status, start_date: episode.start_date, end_date: episode.end_date })), medications: episodeRows.flatMap((episode) => episode.medications ?? []), records: records ?? [], events: events ?? [], followUps: followUps ?? [], memories: memories ?? [], episodeId: activeEpisode?.id ?? null } };
}

async function executeTool(state: typeof WhatsAppCareState.State) {
  if (state.toolResult) return {};
  if (state.intent === "record_dose") return recordDose(state);
  if (!state.context) return {};
  if (state.intent === "unsafe_medication_change") return { toolResult: "Medication changes cannot be made from a WhatsApp message. Ask the caregiver to confirm the clinician instruction in Care Memory before changing a care plan." };
  if (state.intent === "reminder") return { toolResult: "Reminder creation is not available in WhatsApp yet. The user can view and manage medication reminders in Care Memory." };
  if (state.intent !== "health_event") return { toolResult: "Read-only care context retrieved from authorized Care Memory records." };
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("health_events")
    .insert({
      family_member_id: state.context.member.id,
      care_episode_id: state.context.episodeId,
      event_type: "parent_reported",
      title: "WhatsApp health update",
      description: state.input,
      occurred_at: new Date().toISOString(),
      source_type: "whatsapp",
      reported_by_user_id: state.userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { toolResult: `Recorded caregiver-reported health event ${data.id}. This is not a diagnosis.` };
}

async function recordDose(state: typeof WhatsAppCareState.State) {
  if (!state.doseStatus) return { toolResult: "Please tell me whether the dose was taken, missed, or skipped." };
  const supabase = createSupabaseAdminClient();
  const { data: sentJobs, error: jobError } = await supabase
    .from("whatsapp_dose_notifications")
    .select("dose_id,meta_message_id")
    .eq("connection_id", state.connectionId)
    .in("status", ["sent", "delivered", "read"])
    .order("sent_at", { ascending: false })
    .limit(20);
  if (jobError) throw jobError;
  const jobs = state.contextMessageId
    ? (sentJobs ?? []).filter((job) => job.meta_message_id === state.contextMessageId)
    : (sentJobs ?? []).slice(0, 1);
  if (jobs.length !== 1) return { toolResult: "I need you to reply to the medication reminder, or tell me which medication and dose you mean." };
  const doseId = jobs[0].dose_id;
  const { data: dose, error: doseError } = await supabase.from("medication_doses").select("status").eq("id", doseId).maybeSingle();
  if (doseError) throw doseError;
  if (!dose || dose.status !== "scheduled") return { toolResult: "That dose was already recorded." };
  const { error } = await supabase.from("medication_doses").update({ status: state.doseStatus, taken_at: state.doseStatus === "taken" ? new Date().toISOString() : null, caregiver_user_id: state.userId }).eq("id", doseId).eq("status", "scheduled");
  if (error) throw error;
  await supabase.from("whatsapp_dose_notifications").update({ status: "cancelled" }).eq("dose_id", doseId).in("status", ["pending", "processing"]);
  return { toolResult: `Recorded this dose as ${state.doseStatus}.` };
}

async function respond(state: typeof WhatsAppCareState.State) {
  if (state.toolResult && !state.context) return { response: state.toolResult };
  const purpose = state.intent === "summary" ? "summary" : "chat";
  const output = await completeWithFallback(purpose, {
    prompt: `You are Care Memory on WhatsApp. Answer only from the authorized care context below. Be concise and helpful. Never diagnose, prescribe, or invent facts. Clearly label caregiver-reported events. If a medication change is requested, say it needs review and confirmation in the Care Memory app.

Format every response for WhatsApp: use a short *bold heading*, blank lines between sections, and • bullets. For medication courses, use one clearly separated block per course with labels such as Dose, Schedule, Started, Ends, and Taken so far. Do not use Markdown tables, ASCII tables, pipes (|), or dense paragraphs. Keep the response under 1,200 characters unless the user explicitly asks for full detail.

Recent conversation: ${state.conversation}\nUser: ${state.input}\nTool result: ${state.toolResult}\nCare context: ${JSON.stringify(state.context)}`,
  });
  return { response: output.trim().slice(0, 3500) };
}

const whatsappCareGraph = new StateGraph(WhatsAppCareState)
  .addNode("authorize", authorize)
  .addNode("plan", plan)
  .addNode("loadMemberContext", loadMemberContext)
  .addNode("executeTool", executeTool)
  .addNode("respond", respond)
  .addEdge(START, "authorize")
  .addEdge("authorize", "plan")
  .addEdge("plan", "loadMemberContext")
  .addEdge("loadMemberContext", "executeTool")
  .addEdge("executeTool", "respond")
  .addEdge("respond", END)
  .compile();

export async function invokeWhatsAppCareGraph(senderId: string, input: string, connectionId: string, contextMessageId?: string) {
  return whatsappCareGraph.invoke({ senderId, input, connectionId, contextMessageId, threadId: whatsappThreadId(connectionId) });
}
