import { recordUnderstandingSchema } from "@/lib/ai/schemas/record-understanding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { z } from "zod";
import { writeMemorySafely } from "@/server/services/memory";

const confirmSchema = z.object({ recordId: z.string(), memberId: z.string(), episodeTitle: z.string().min(1).max(120), understanding: recordUnderstandingSchema });

export async function POST(request: Request) {
  const input = confirmSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "The reviewed care plan is invalid." }, { status: 400 });
  try {
    const context = await requireCareContext();
    if (context.isDemo) return Response.json({ episodeId: "demo-episode", doseCount: 30, mode: "demo" });
    const medication = input.data.understanding.medications[0];
    if (!medication) return Response.json({ error: "No medication plan was confirmed." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("confirm_prescription_care_plan", { target_record_id: input.data.recordId, target_member_id: input.data.memberId, episode_title: input.data.episodeTitle, medication_input: medication, follow_up_input: input.data.understanding.followUps[0] ?? null });
    if (error) throw error;
    await writeMemorySafely({ memberId: input.data.memberId, episodeId: String(data), category: "semantic", text: `${medication.name} ${medication.dose} ${medication.unit}, ${medication.frequencyPerDay} times daily for ${medication.durationDays} days.`, sourceType: "record", sourceId: input.data.recordId, createdAt: new Date().toISOString() });
    return Response.json({ episodeId: data, doseCount: medication.frequencyPerDay * medication.durationDays, mode: "configured" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Care-plan confirmation failed." }, { status: 500 });
  }
}
