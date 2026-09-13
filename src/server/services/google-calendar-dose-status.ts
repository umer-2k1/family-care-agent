import { buildDoseCalendarDetails, doseCalendarEventId, isMissingGoogleEvent } from "@/lib/calendar/google-event";
import { decryptToken } from "@/lib/security/token-encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCareDashboard } from "@/server/repositories/care";
import { google } from "googleapis";

export async function syncDoseStatusToCalendarSafely(doseId: string, status: string, userId: string, origin: string) {
  try {
    const care = await getActiveCareDashboard();
    const dose = care?.doses.find((candidate) => candidate.id === doseId);
    if (!care || !dose) return;
    const supabase = await createSupabaseServerClient();
    const { data: connection, error } = await supabase.from("calendar_connections").select("encrypted_access_token,encrypted_refresh_token").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!connection?.encrypted_access_token) return;
    const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${origin}/auth/callback`);
    oauth.setCredentials({ access_token: decryptToken(connection.encrypted_access_token), refresh_token: connection.encrypted_refresh_token ? decryptToken(connection.encrypted_refresh_token) : undefined });
    const start = new Date(dose.scheduledAt);
    const medication = { name: care.medicationName, dose: care.dose, unit: care.unit, frequencyPerDay: care.frequencyPerDay, durationDays: care.durationDays, instructions: care.instructions };
    await google.calendar({ version: "v3", auth: oauth }).events.patch({
      calendarId: "primary",
      eventId: doseCalendarEventId(doseId),
      requestBody: { ...buildDoseCalendarDetails({ memberName: care.memberName, medication, status }), start: { dateTime: start.toISOString() }, end: { dateTime: new Date(start.getTime() + 15 * 60000).toISOString() } },
    });
    console.info(`[calendar] Dose event status synchronized doseId=${doseId} status=${status}`);
  } catch (error) {
    if (isMissingGoogleEvent(error)) {
      console.info(`[calendar] Dose has no linked Google event doseId=${doseId}`);
      return;
    }
    console.warn(`[calendar] Dose status changed but Calendar synchronization failed doseId=${doseId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
