import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { demoFamily } from "@/lib/demo-data";

export type FamilyMemberRow = {
  id: string;
  family_id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
};

export async function listFamilyMembers(): Promise<FamilyMemberRow[]> {
  const context = await requireCareContext();
  if (context.isDemo) return demoFamily.map((member) => ({ id: member.id, family_id: context.familyId, name: member.name, relationship: member.relationship, date_of_birth: null, avatar_url: null, notes: member.status, created_at: "2026-09-03T00:00:00Z" }));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("family_members").select("*").eq("family_id", context.familyId).order("created_at");
  if (error) throw new Error(`Unable to load family members: ${error.message}`);
  return data as FamilyMemberRow[];
}

export async function getFamilyMember(id: string): Promise<FamilyMemberRow | null> {
  const context = await requireCareContext();
  if (context.isDemo) return (await listFamilyMembers()).find((member) => member.id === id) ?? null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("family_members").select("*").eq("family_id", context.familyId).eq("id", id).maybeSingle();
  if (error) throw new Error(`Unable to load family member: ${error.message}`);
  return data as FamilyMemberRow | null;
}
