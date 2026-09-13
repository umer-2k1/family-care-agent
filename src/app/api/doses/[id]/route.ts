import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { syncDoseStatusToCalendarSafely } from "@/server/services/google-calendar-dose-status";
import { z } from "zod";

const doseSchema = z.object({ status: z.enum(["taken", "missed", "skipped"]), notes: z.string().max(500).optional(), caregiverMemberId: z.string().uuid().nullable().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const input = doseSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "Invalid dose update." }, { status: 400 });
  const { id } = await params;
  try {
    const context = await requireCareContext();
    if (context.isDemo) return Response.json({ id, ...input.data, takenAt: input.data.status === "taken" ? new Date().toISOString() : null, mode: "demo" });
    const supabase = await createSupabaseServerClient();
    if (input.data.caregiverMemberId) {
      const { data: caregiver } = await supabase.from("family_members").select("id").eq("id", input.data.caregiverMemberId).eq("family_id", context.familyId).maybeSingle();
      if (!caregiver) return Response.json({ error: "Caregiver is not in this family." }, { status: 400 });
    }
    const { data, error } = await supabase.from("medication_doses").update({ status: input.data.status, taken_at: input.data.status === "taken" ? new Date().toISOString() : null, caregiver_user_id: context.userId, caregiver_member_id: input.data.caregiverMemberId ?? null, notes: input.data.notes ?? null }).eq("id", id).select("id,status,taken_at,caregiver_member_id").single();
    if (error) throw error;
    await syncDoseStatusToCalendarSafely(id, input.data.status, context.userId, new URL(request.url).origin);
    return Response.json(data);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Dose update failed." }, { status: 500 }); }
}
