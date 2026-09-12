import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";

export type MemberProfileData = {
  episodes: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    endDate: string | null;
    medications: Array<{ id: string; name: string; dose: number; unit: string; frequencyPerDay: number; durationDays: number }>;
    followUps: Array<{ id: string; title: string; dueAt: string; status: string }>;
  }>;
  records: Array<{ id: string; recordType: string; status: string; createdAt: string; confirmedAt: string | null }>;
  events: Array<{ id: string; title: string; description: string | null; occurredAt: string; sourceType: string }>;
};

export async function getMemberProfileData(memberId: string): Promise<MemberProfileData> {
  const context = await requireCareContext();
  if (context.isDemo) {
    if (memberId !== "emma") return { episodes: [], records: [], events: [] };
    return {
      episodes: [{
        id: "demo-episode",
        title: "Ear infection",
        status: "active",
        startDate: "2026-09-06",
        endDate: "2026-09-20",
        medications: [{ id: "demo-med", name: "Amoxicillin", dose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15 }],
        followUps: [{ id: "demo-follow-up", title: "Pediatrician review", dueAt: "2026-09-20T09:00:00Z", status: "pending" }],
      }],
      records: [{ id: "demo-record", recordType: "prescription", status: "confirmed", createdAt: "2026-09-06T09:00:00Z", confirmedAt: "2026-09-06T09:05:00Z" }],
      events: [{ id: "demo-event", title: "Rash reported", description: "A rash was reported during treatment.", occurredAt: "2026-09-09T15:00:00Z", sourceType: "parent_reported" }],
    };
  }

  const supabase = await createSupabaseServerClient();
  const [episodeResult, recordResult, eventResult] = await Promise.all([
    supabase
      .from("care_episodes")
      .select("id,title,status,start_date,end_date,medications(id,name,dose,unit,frequency_per_day,duration_days),follow_ups(id,title,due_at,status),family_members!inner(family_id)")
      .eq("family_member_id", memberId)
      .eq("family_members.family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("health_records")
      .select("id,record_type,status,created_at,confirmed_at")
      .eq("family_member_id", memberId)
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("health_events")
      .select("id,title,description,occurred_at,source_type,family_members!inner(family_id)")
      .eq("family_member_id", memberId)
      .eq("family_members.family_id", context.familyId)
      .order("occurred_at", { ascending: false }),
  ]);

  const firstError = episodeResult.error ?? recordResult.error ?? eventResult.error;
  if (firstError) throw new Error(`Unable to load member profile: ${firstError.message}`);

  const episodes = (episodeResult.data ?? []) as unknown as Array<{
    id: string; title: string; status: string; start_date: string; end_date: string | null;
    medications: Array<{ id: string; name: string; dose: number; unit: string; frequency_per_day: number; duration_days: number }>;
    follow_ups: Array<{ id: string; title: string; due_at: string; status: string }>;
  }>;
  return {
    episodes: episodes.map((episode) => ({
      id: episode.id,
      title: episode.title,
      status: episode.status,
      startDate: episode.start_date,
      endDate: episode.end_date,
      medications: episode.medications.map((medication) => ({
        id: medication.id,
        name: medication.name,
        dose: medication.dose,
        unit: medication.unit,
        frequencyPerDay: medication.frequency_per_day,
        durationDays: medication.duration_days,
      })),
      followUps: episode.follow_ups.map((followUp) => ({ id: followUp.id, title: followUp.title, dueAt: followUp.due_at, status: followUp.status })),
    })),
    records: (recordResult.data ?? []).map((record) => ({ id: record.id, recordType: record.record_type, status: record.status, createdAt: record.created_at, confirmedAt: record.confirmed_at })),
    events: (eventResult.data ?? []).map((event) => ({ id: event.id, title: event.title, description: event.description, occurredAt: event.occurred_at, sourceType: event.source_type })),
  };
}
