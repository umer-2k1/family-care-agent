import { buildDoseCalendarDetails, buildFollowUpCalendarDetails, doseCalendarEventId, isExistingGoogleEvent, isGoogleCalendarRateLimit, isMissingGoogleEvent, relatedMemberName } from "@/lib/calendar/google-event";
import { isDemoMode } from "@/lib/demo-mode";
import { decryptToken } from "@/lib/security/token-encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { calendar_v3, google } from "googleapis";
import { z } from "zod";

const syncSchema = z.object({ episodeId: z.string().uuid() });
type Medication = { name: string; dose: number; unit: string; frequencyPerDay: number; durationDays: number; instructions: string | null; doses: Array<{ id: string; scheduledAt: string; status: string }> };

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withCalendarRetry<T>(operation: () => Promise<T>) {
  for (let attempt = 0; ; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (!isGoogleCalendarRateLimit(error) || attempt >= 4) throw error;
      await delay(1000 * 2 ** attempt);
    }
  }
}

async function syncDose(calendar: calendar_v3.Calendar, memberName: string, medication: Medication, dose: Medication["doses"][number], previouslySynced: boolean) {
  const start = new Date(dose.scheduledAt);
  const requestBody = { ...buildDoseCalendarDetails({ memberName, medication, status: dose.status }), start: { dateTime: start.toISOString() }, end: { dateTime: new Date(start.getTime() + 15 * 60000).toISOString() }, reminders: { useDefault: true } };
  const eventId = doseCalendarEventId(dose.id);
  if (previouslySynced) {
    try { await withCalendarRetry(() => calendar.events.patch({ calendarId: "primary", eventId, requestBody })); return; }
    catch (error) { if (!isMissingGoogleEvent(error)) throw error; }
    await withCalendarRetry(() => calendar.events.insert({ calendarId: "primary", requestBody: { id: eventId, ...requestBody } }));
    return;
  }
  try { await withCalendarRetry(() => calendar.events.insert({ calendarId: "primary", requestBody: { id: eventId, ...requestBody } })); }
  catch (error) { if (!isExistingGoogleEvent(error)) throw error; await withCalendarRetry(() => calendar.events.patch({ calendarId: "primary", eventId, requestBody })); }
}

async function syncDoses(calendar: calendar_v3.Calendar, memberName: string, medication: Medication, previouslySynced: boolean) {
  for (const dose of medication.doses) {
    await syncDose(calendar, memberName, medication, dose, previouslySynced);
    await delay(250);
  }
}

async function syncFollowUp(calendar: calendar_v3.Calendar, followUp: { id: string; title: string; dueAt: string; eventId: string | null }, memberName: string, medication: Medication) {
  const start = new Date(followUp.dueAt);
  const requestBody = { ...buildFollowUpCalendarDetails({ title: followUp.title, memberName, medication }), start: { dateTime: start.toISOString() }, end: { dateTime: new Date(start.getTime() + 30 * 60000).toISOString() }, reminders: { useDefault: true } };
  if (followUp.eventId) {
    try { const existing = await calendar.events.get({ calendarId: "primary", eventId: followUp.eventId }); if (existing.data.status !== "cancelled") { const updated = await calendar.events.patch({ calendarId: "primary", eventId: followUp.eventId, requestBody }); return updated.data.id ?? followUp.eventId; } }
    catch (error) { if (!isMissingGoogleEvent(error)) throw error; }
  }
  const deterministicId = followUp.id.replaceAll("-", "").toLowerCase();
  try { const created = await calendar.events.insert({ calendarId: "primary", requestBody: { id: followUp.eventId ? undefined : deterministicId, ...requestBody } }); return created.data.id; }
  catch (error) { if (followUp.eventId || !isExistingGoogleEvent(error)) throw error; const updated = await calendar.events.patch({ calendarId: "primary", eventId: deterministicId, requestBody }); return updated.data.id; }
}

async function synchronize(request: Request, episodeId: string) {
  const context = await requireCareContext();
  const supabase = await createSupabaseServerClient();
  const [connectionResult, episodeResult] = await Promise.all([
    supabase.from("calendar_connections").select("encrypted_access_token,encrypted_refresh_token").eq("user_id", context.userId).maybeSingle(),
    supabase.from("care_episodes").select("id,google_calendar_synced_at,family_members!inner(name,family_id),medications(name,dose,unit,frequency_per_day,duration_days,instructions,medication_doses(id,scheduled_at,status)),follow_ups(id,title,due_at,google_calendar_event_id)").eq("id", episodeId).eq("family_members.family_id", context.familyId).maybeSingle(),
  ]);
  if (connectionResult.error) throw connectionResult.error;
  if (episodeResult.error) throw episodeResult.error;
  if (!episodeResult.data) return { status: 404, body: { error: "Care episode not found." } };
  if (!connectionResult.data?.encrypted_access_token) return { status: 409, body: { error: "Google Calendar authorization is required.", authorizationUrl: "/api/auth/google?next=%2Fauth%2Fcalendar-complete" } };
  const row = episodeResult.data;
  const medicationRow = row.medications[0];
  if (!medicationRow) throw new Error("The medication schedule could not be found.");
  const medication: Medication = { name: medicationRow.name, dose: medicationRow.dose, unit: medicationRow.unit, frequencyPerDay: medicationRow.frequency_per_day, durationDays: medicationRow.duration_days, instructions: medicationRow.instructions, doses: medicationRow.medication_doses.map((dose) => ({ id: dose.id, scheduledAt: dose.scheduled_at, status: dose.status })) };
  const memberName = relatedMemberName(row.family_members);
  const requestUrl = new URL(request.url);
  const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${requestUrl.origin}/auth/callback`);
  oauth.setCredentials({ access_token: decryptToken(connectionResult.data.encrypted_access_token), refresh_token: connectionResult.data.encrypted_refresh_token ? decryptToken(connectionResult.data.encrypted_refresh_token) : undefined });
  const calendar = google.calendar({ version: "v3", auth: oauth });
  const followUpRow = row.follow_ups[0];
  if (followUpRow) {
    const eventId = await syncFollowUp(calendar, { id: followUpRow.id, title: followUpRow.title, dueAt: followUpRow.due_at, eventId: followUpRow.google_calendar_event_id }, memberName, medication);
    if (!eventId) throw new Error("Google Calendar returned no follow-up event ID.");
    const { error } = await supabase.from("follow_ups").update({ google_calendar_event_id: eventId, status: "scheduled" }).eq("id", followUpRow.id);
    if (error) throw error;
  }
  await syncDoses(calendar, memberName, medication, Boolean(row.google_calendar_synced_at));
  const eventCount = medication.doses.length + (followUpRow ? 1 : 0);
  const { error: syncStateError } = await supabase.from("care_episodes").update({ google_calendar_synced_at: new Date().toISOString(), google_calendar_event_count: eventCount }).eq("id", episodeId);
  if (syncStateError) throw syncStateError;
  console.info(`[calendar] Care-plan synchronization completed episodeId=${episodeId} eventCount=${eventCount}`);
  return { status: 200, body: { success: true, episodeId, doseCount: medication.doses.length, eventCount } };
}

export async function POST(request: Request) {
  const input = syncSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "A valid care episode is required." }, { status: 400 });
  if (isDemoMode()) return Response.json({ error: "Demo mode does not create external Calendar events." }, { status: 409 });
  console.info(`[calendar] Care-plan synchronization started episodeId=${input.data.episodeId}`);
  try { const result = await synchronize(request, input.data.episodeId); return Response.json(result.body, { status: result.status }); }
  catch (error) { const message = error instanceof Error ? error.message : "Calendar failed"; console.error(`[calendar] Care-plan synchronization failed episodeId=${input.data.episodeId}: ${message}`); return Response.json({ error: message }, { status: 500 }); }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const followUpId = url.searchParams.get("followUpId");
  if (!followUpId) return Response.json({ error: "Refresh the page and use the in-app Calendar button." }, { status: 400 });
  try {
    const context = await requireCareContext();
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("follow_ups").select("care_episode_id,family_members!inner(family_id)").eq("id", followUpId).eq("family_members.family_id", context.familyId).maybeSingle();
    if (!data?.care_episode_id) return Response.json({ error: "Follow-up not found." }, { status: 404 });
    const result = await synchronize(request, data.care_episode_id);
    return Response.json({ ...result.body, compatibilityRequest: true }, { status: result.status });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Calendar failed" }, { status: 500 }); }
}
