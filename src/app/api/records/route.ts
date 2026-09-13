import { deleteHealthRecordAsset, uploadHealthRecord } from "@/lib/cloudinary/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { understandHealthRecord } from "@/server/services/record-understanding";
import { confirmedFollowUpSchema, confirmedRecordUnderstandingSchema } from "@/lib/ai/schemas/record-understanding";
import { writeMemorySafely } from "@/server/services/memory";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  try {
    const context = await requireCareContext();
    const form = await request.formData();
    const file = form.get("file");
    const memberId = form.get("memberId");
    if (!(file instanceof File) || typeof memberId !== "string") return Response.json({ error: "A file and family member are required." }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ error: "Upload a JPG, PNG, WebP, or PDF up to 10 MB." }, { status: 400 });
    if (context.isDemo) {
      console.info("[records] Returning isolated demo record understanding", { fileName: file.name, mimeType: file.type, sizeBytes: file.size });
      return Response.json({ id: "demo-record", understanding: { recordType: "prescription", confidence: 0.98, summary: "Amoxicillin treatment for an ear infection.", medications: [{ name: "Amoxicillin", dose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15, instructions: "After meals", startDate: "2026-09-12", asNeeded: false }], followUps: [{ title: "Pediatrician review", dueText: "in 2 weeks" }], requiresUserClarification: false }, mode: "demo" });
    }

    const supabase = await createSupabaseServerClient();
    const { data: member } = await supabase.from("family_members").select("id").eq("id", memberId).eq("family_id", context.familyId).maybeSingle();
    if (!member) return Response.json({ error: "Family member not found." }, { status: 404 });
    const asset = await uploadHealthRecord(file, context.familyId);
    const { data: record, error } = await supabase.from("health_records").insert({ family_id: context.familyId, family_member_id: memberId, cloudinary_public_id: asset.publicId, cloudinary_url: asset.secureUrl, mime_type: file.type, status: "understanding" }).select("id").single();
    if (error) {
      await deleteHealthRecordAsset(asset.publicId, asset.resourceType).catch(() => undefined);
      throw error;
    }
    let understanding;
    try { understanding = await understandHealthRecord(file); }
    catch (understandingError) {
      console.error("[records] Record understanding failed", { recordId: record.id, error: understandingError instanceof Error ? understandingError.message : "Unknown error" });
      await supabase.from("health_records").update({ status: "understanding_failed" }).eq("id", record.id);
      throw understandingError;
    }
    const { error: updateError } = await supabase.from("health_records").update({ record_type: understanding.recordType, status: "review", raw_ai_output_json: understanding }).eq("id", record.id);
    if (updateError) throw updateError;
    const { data: { user } } = await supabase.auth.getUser();
    const confirmed = confirmedRecordUnderstandingSchema.safeParse(understanding);
    const shouldAutomate = user?.user_metadata.calendar_auto_sync === true && understanding.confidence >= 0.9 && !understanding.requiresUserClarification && confirmed.success;
    if (shouldAutomate) {
      const medication = confirmed.data.medications[0];
      const followUp = confirmedFollowUpSchema.safeParse(confirmed.data.followUps[0]);
      const { data: episodeId, error } = await supabase.rpc("confirm_prescription_care_plan", { target_record_id: record.id, target_member_id: memberId, episode_title: `${medication.name} treatment`, medication_input: medication, follow_up_input: followUp.success ? followUp.data : null });
      if (error) throw error;
      await writeMemorySafely({ memberId, episodeId: String(episodeId), category: "semantic", text: `${medication.name} ${medication.dose} ${medication.unit}, ${medication.frequencyPerDay} times daily for ${medication.durationDays} days.`, sourceType: "record", sourceId: record.id, createdAt: new Date().toISOString() });
      console.info(`[records] Automatic care plan created recordId=${record.id} episodeId=${episodeId}`);
      return Response.json({ id: record.id, understanding: confirmed.data, autoCalendarEpisodeId: String(episodeId), mode: "configured" }, { status: 201 });
    }
    console.info("[records] Record is ready for user review", { recordId: record.id, recordType: understanding.recordType, medicationCount: understanding.medications.length });
    return Response.json({ id: record.id, understanding, mode: "configured" }, { status: 201 });
  } catch (error) {
    console.error("[records] Upload request failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: error instanceof Error ? error.message : "Record processing failed." }, { status: 500 });
  }
}
