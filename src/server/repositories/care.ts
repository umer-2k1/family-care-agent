import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";

export type CareDashboard = { episodeId: string; memberId: string; memberName: string; title: string; medicationId: string; medicationName: string; dose: number; unit: string; instructions: string | null; durationDays: number; frequencyPerDay: number; calendarSyncedAt: string | null; calendarEventCount: number; doses: Array<{ id: string; scheduledAt: string; status: string; caregiverName?: string }>; followUp?: { id: string; title: string; dueAt: string; status: string; calendarEventId: string | null } };

const demoCare: CareDashboard = { episodeId: "demo-episode", memberId: "emma", memberName: "Emma", title: "Ear infection", medicationId: "demo-med", medicationName: "Amoxicillin", dose: 5, unit: "ml", instructions: "After meals", durationDays: 15, frequencyPerDay: 2, calendarSyncedAt: null, calendarEventCount: 0, doses: Array.from({ length: 30 }, (_, index) => ({ id: `dose-${index + 1}`, scheduledAt: new Date(Date.now() + index * 43200000).toISOString(), status: index < 7 ? "taken" : "scheduled" })), followUp: { id: "demo-follow-up", title: "Pediatrician review", dueAt: new Date(Date.now() + 3 * 86400000).toISOString(), status: "pending", calendarEventId: null } };

type CareEpisodeRow = { id: string; title: string; family_member_id: string; google_calendar_synced_at: string | null; google_calendar_event_count: number; family_members: { name: string } | Array<{ name: string }>; medications: Array<{ id: string; name: string; dose: number; unit: string; instructions: string | null; duration_days: number; frequency_per_day: number; medication_doses: Array<{ id: string; scheduled_at: string; status: string; caregiver?: { name: string } | null }> }>; follow_ups: Array<{ id: string; title: string; due_at: string; status: string; google_calendar_event_id: string | null }> };

function mapCareEpisode(row: CareEpisodeRow): CareDashboard | null {
  const medication = row.medications[0];
  if (!medication) return null;
  const relation = Array.isArray(row.family_members) ? row.family_members[0] : row.family_members;
  const followUp = row.follow_ups[0];
  return { episodeId: row.id, memberId: row.family_member_id, memberName: relation?.name ?? "Family member", title: row.title, medicationId: medication.id, medicationName: medication.name, dose: medication.dose, unit: medication.unit, instructions: medication.instructions, durationDays: medication.duration_days, frequencyPerDay: medication.frequency_per_day, calendarSyncedAt: row.google_calendar_synced_at, calendarEventCount: row.google_calendar_event_count, doses: medication.medication_doses.map((dose) => ({ id: dose.id, scheduledAt: dose.scheduled_at, status: dose.status, caregiverName: dose.caregiver?.name })), followUp: followUp ? { id: followUp.id, title: followUp.title, dueAt: followUp.due_at, status: followUp.status, calendarEventId: followUp.google_calendar_event_id } : undefined };
}

export async function getActiveCareDashboards(): Promise<CareDashboard[]> {
  const context = await requireCareContext();
  if (context.isDemo) return [demoCare];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("care_episodes").select("id,title,family_member_id,google_calendar_synced_at,google_calendar_event_count,family_members!inner(name,family_id),medications(id,name,dose,unit,instructions,duration_days,frequency_per_day,medication_doses(id,scheduled_at,status,caregiver_member_id,caregiver:family_members(name))),follow_ups(id,title,due_at,status,google_calendar_event_id)").eq("status", "active").eq("family_members.family_id", context.familyId).order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load care episode: ${error.message}`);
  return (data as unknown as CareEpisodeRow[]).map(mapCareEpisode).filter((care): care is CareDashboard => Boolean(care));
}

export async function getActiveCareDashboard(): Promise<CareDashboard | null> {
  const dashboards = await getActiveCareDashboards();
  return dashboards[0] ?? null;
}
