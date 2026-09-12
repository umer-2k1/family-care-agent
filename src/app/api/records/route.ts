import { deleteHealthRecordAsset, uploadHealthRecord } from "@/lib/cloudinary/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { understandHealthRecord } from "@/server/services/record-understanding";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  try {
    const context = await requireCareContext();
    const form = await request.formData();
    const file = form.get("file");
    const memberId = form.get("memberId");
    if (!(file instanceof File) || typeof memberId !== "string") return Response.json({ error: "A file and family member are required." }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ error: "Upload a JPG, PNG, WebP, or PDF up to 10 MB." }, { status: 400 });
    if (context.isDemo) return Response.json({ id: "demo-record", understanding: { recordType: "prescription", confidence: 0.98, summary: "Amoxicillin treatment for an ear infection.", medications: [{ name: "Amoxicillin", dose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15, instructions: "After meals" }], followUps: [{ title: "Pediatrician review", dueText: "in 2 weeks" }], requiresUserClarification: false }, mode: "demo" });

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
    catch (understandingError) { await supabase.from("health_records").update({ status: "understanding_failed" }).eq("id", record.id); throw understandingError; }
    const { error: updateError } = await supabase.from("health_records").update({ record_type: understanding.recordType, status: "review", raw_ai_output_json: understanding }).eq("id", record.id);
    if (updateError) throw updateError;
    return Response.json({ id: record.id, understanding, mode: "configured" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Record processing failed." }, { status: 500 });
  }
}
