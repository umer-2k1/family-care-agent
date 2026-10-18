"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const memberSchema = z.object({ name: z.string().trim().min(1).max(100), relationship: z.string().trim().min(1).max(60), dateOfBirth: z.string().optional(), notes: z.string().trim().max(1000).optional() });
export type FamilyActionState = { success: boolean; error?: string };

export async function createFamilyMember(_: FamilyActionState, formData: FormData): Promise<FamilyActionState> {
  const input = memberSchema.safeParse({ name: formData.get("name"), relationship: formData.get("relationship"), dateOfBirth: formData.get("dateOfBirth") || undefined, notes: formData.get("notes") || undefined });
  if (!input.success) return { success: false, error: input.error.issues[0]?.message ?? "Invalid member details." };
  try {
    const context = await requireCareContext();
    if (context.isDemo) return { success: false, error: "Switch off demo mode and connect Supabase to save family members." };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("family_members").insert({ family_id: context.familyId, name: input.data.name, relationship: input.data.relationship, date_of_birth: input.data.dateOfBirth || null, notes: input.data.notes || null });
    if (error) throw error;
    revalidatePath("/family");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to add family member." };
  }
}

export async function updateFamilyMember(formData: FormData) {
  const id = formData.get("id");
  const input = memberSchema.safeParse({ name: formData.get("name"), relationship: formData.get("relationship"), dateOfBirth: formData.get("dateOfBirth") || undefined, notes: formData.get("notes") || undefined });
  if (typeof id !== "string" || !input.success) throw new Error("Invalid member details.");
  const context = await requireCareContext();
  if (context.isDemo) throw new Error("Switch off demo mode and connect Supabase to update family members.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("family_members").update({ name: input.data.name, relationship: input.data.relationship, date_of_birth: input.data.dateOfBirth || null, notes: input.data.notes || null }).eq("id", id).eq("family_id", context.familyId);
  if (error) throw error;
  revalidatePath(`/family/${id}`); revalidatePath("/family");
}
