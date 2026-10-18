import { confirmedFollowUpSchema, confirmedRecordUnderstandingSchema, recordUnderstandingSchema } from "@/lib/ai/schemas/record-understanding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { z } from "zod";
import { writeMemorySafely } from "@/server/services/memory";
import { enqueueWhatsAppNotifications } from "@/server/services/whatsapp";

const saveRecordSchema = z.object({ action: z.literal("record_only"), recordId: z.string(), memberId: z.string(), understanding: recordUnderstandingSchema });
const createCarePlanSchema = z.object({ action: z.literal("create_care_plan"), recordId: z.string(), memberId: z.string(), episodeTitle: z.string().min(1).max(120), understanding: confirmedRecordUnderstandingSchema });
const confirmSchema = z.discriminatedUnion("action", [saveRecordSchema, createCarePlanSchema]);

export async function POST(request: Request) {
  const input = confirmSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "The reviewed care plan is invalid." }, { status: 400 });
  try {
    const context = await requireCareContext();
    if (context.isDemo) return Response.json(input.data.action === "record_only" ? { recordId: "demo-record", mode: "demo" } : { episodeId: "demo-episode", doseCount: 30, mode: "demo" });
    const supabase = await createSupabaseServerClient();
    if (input.data.action === "record_only") {
      const { data, error } = await supabase.from("health_records").update({ record_type: input.data.understanding.recordType, status: "confirmed", confirmed_at: new Date().toISOString(), raw_ai_output_json: input.data.understanding }).eq("id", input.data.recordId).eq("family_id", context.familyId).eq("family_member_id", input.data.memberId).select("id").single();
      if (error) throw error;
      console.info("[records] Reviewed health record saved without a care plan", { recordId: data.id, recordType: input.data.understanding.recordType });
      return Response.json({ recordId: data.id, mode: "configured" });
    }
    const medication = input.data.understanding.medications[0];
    if (!medication) return Response.json({ error: "No medication plan was confirmed." }, { status: 400 });
    const followUp = confirmedFollowUpSchema.safeParse(input.data.understanding.followUps[0]);
    const { data, error } = await supabase.rpc("confirm_prescription_care_plan", { target_record_id: input.data.recordId, target_member_id: input.data.memberId, episode_title: input.data.episodeTitle, medication_input: medication, follow_up_input: followUp.success ? followUp.data : null });
    if (error) throw error;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: whatsappConnection } = await supabase.from("whatsapp_connections").select("id").eq("user_id", context.userId).eq("status", "connected").maybeSingle();
    if (whatsappConnection) await enqueueWhatsAppNotifications(whatsappConnection.id, context.familyId).catch((whatsappError) => console.warn("[whatsapp] Care plan created but notification enqueue failed", whatsappError));
    await writeMemorySafely({ memberId: input.data.memberId, episodeId: String(data), category: "semantic", text: `${medication.name} ${medication.dose} ${medication.unit}, ${medication.frequencyPerDay} times daily for ${medication.durationDays} days.`, sourceType: "record", sourceId: input.data.recordId, createdAt: new Date().toISOString() });
    return Response.json({ episodeId: data, autoCalendarEpisodeId: user?.user_metadata.calendar_auto_sync === true ? String(data) : undefined, doseCount: medication.frequencyPerDay * medication.durationDays, mode: "configured" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Care-plan confirmation failed." }, { status: 500 });
  }
}
