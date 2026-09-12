import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";

export type CareDashboard = { episodeId: string; memberId: string; memberName: string; title: string; medicationId: string; medicationName: string; dose: number; unit: string; instructions: string | null; durationDays: number; frequencyPerDay: number; doses: Array<{ id: string; scheduledAt: string; status: string; caregiverName?: string }>; followUp?: { id: string; title: string; dueAt: string; status: string; calendarEventId: string | null } };

export async function getActiveCareDashboard(): Promise<CareDashboard | null> {
  const context = await requireCareContext();
  if (context.isDemo) return { episodeId: "demo-episode", memberId: "emma", memberName: "Emma", title: "Ear infection", medicationId: "demo-med", medicationName: "Amoxicillin", dose: 5, unit: "ml", instructions: "After meals", durationDays: 15, frequencyPerDay: 2, doses: Array.from({ length: 30 }, (_, index) => ({ id: `dose-${index + 1}`, scheduledAt: new Date(Date.now() + index * 43200000).toISOString(), status: index < 7 ? "taken" : "scheduled" })), followUp: { id: "demo-follow-up", title: "Pediatrician review", dueAt: new Date(Date.now() + 3 * 86400000).toISOString(), status: "pending", calendarEventId: null } };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("care_episodes").select("id,title,family_member_id,family_members!inner(name,family_id),medications(id,name,dose,unit,instructions,duration_days,frequency_per_day,medication_doses(id,scheduled_at,status,caregiver_member_id,caregiver:family_members(name))),follow_ups(id,title,due_at,status,google_calendar_event_id)").eq("status", "active").eq("family_members.family_id", context.familyId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Unable to load care episode: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as { id: string; title: string; family_member_id: string; family_members: { name: string }; medications: Array<{ id: string; name: string; dose: number; unit: string; instructions: string | null; duration_days: number; frequency_per_day: number; medication_doses: Array<{ id: string; scheduled_at: string; status: string; caregiver?: { name: string } | null }> }>; follow_ups: Array<{ id: string; title: string; due_at: string; status: string; google_calendar_event_id: string | null }> };
  const medication = row.medications[0];
  if (!medication) return null;
  const followUp = row.follow_ups[0];
  return { episodeId: row.id, memberId: row.family_member_id, memberName: row.family_members.name, title: row.title, medicationId: medication.id, medicationName: medication.name, dose: medication.dose, unit: medication.unit, instructions: medication.instructions, durationDays: medication.duration_days, frequencyPerDay: medication.frequency_per_day, doses: medication.medication_doses.map((dose) => ({ id: dose.id, scheduledAt: dose.scheduled_at, status: dose.status, caregiverName: dose.caregiver?.name })), followUp: followUp ? { id: followUp.id, title: followUp.title, dueAt: followUp.due_at, status: followUp.status, calendarEventId: followUp.google_calendar_event_id } : undefined };
}
