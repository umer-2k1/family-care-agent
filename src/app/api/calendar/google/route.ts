import { isDemoMode } from "@/lib/demo-mode";
import { decryptToken } from "@/lib/security/token-encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const followUpId = url.searchParams.get("followUpId");
  if (!followUpId) return Response.json({ error: "A follow-up is required." }, { status: 400 });
  if (isDemoMode()) return NextResponse.redirect(new URL("/care?calendar=demo", url.origin));
  try {
    const context = await requireCareContext();
    const supabase = await createSupabaseServerClient();
    const [{ data: connection }, { data: followUp }] = await Promise.all([
      supabase.from("calendar_connections").select("encrypted_access_token,encrypted_refresh_token").eq("user_id", context.userId).maybeSingle(),
      supabase.from("follow_ups").select("id,title,due_at,google_calendar_event_id,family_members!inner(name,family_id)").eq("id", followUpId).eq("family_members.family_id", context.familyId).maybeSingle(),
    ]);
    if (!followUp) return Response.json({ error: "Follow-up not found." }, { status: 404 });
    if (followUp.google_calendar_event_id) return NextResponse.redirect(new URL("/care?calendar=already-added", url.origin));
    if (!connection?.encrypted_access_token) return NextResponse.redirect(new URL("/api/auth/google", url.origin));
    const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${url.origin}/auth/callback`);
    oauth.setCredentials({ access_token: decryptToken(connection.encrypted_access_token), refresh_token: connection.encrypted_refresh_token ? decryptToken(connection.encrypted_refresh_token) : undefined });
    const calendar = google.calendar({ version: "v3", auth: oauth });
    const start = new Date(followUp.due_at); const end = new Date(start.getTime() + 30 * 60000);
    const eventId = followUp.id.replaceAll("-", "").toLowerCase();
    const event = await calendar.events.insert({ calendarId: "primary", requestBody: { id: eventId, summary: followUp.title, description: "Family care follow-up created by Care Memory.", start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, reminders: { useDefault: true } } });
    if (!event.data.id) throw new Error("Google Calendar returned no event ID.");
    const { error } = await supabase.from("follow_ups").update({ google_calendar_event_id: event.data.id, status: "scheduled" }).eq("id", followUp.id);
    if (error) throw error;
    return NextResponse.redirect(new URL("/care?calendar=added", url.origin));
  } catch (error) {
    return NextResponse.redirect(new URL(`/care?calendarError=${encodeURIComponent(error instanceof Error ? error.message : "Calendar failed")}`, url.origin));
  }
}
