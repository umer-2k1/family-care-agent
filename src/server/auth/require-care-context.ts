import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CareContext = {
  userId: string;
  familyId: string;
  isDemo: boolean;
};

export async function requireCareContext(): Promise<CareContext> {
  if (isDemoMode()) return { userId: "demo-user", familyId: "demo-family", isDemo: true };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required.");

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (familyError) throw new Error(`Unable to load family: ${familyError.message}`);
  if (family) return { userId: user.id, familyId: family.id, isDemo: false };

  const { data: createdFamily, error: createError } = await supabase
    .from("families")
    .insert({ owner_user_id: user.id, name: "My Family" })
    .select("id")
    .single();

  if (createError || !createdFamily) throw new Error(`Unable to create family workspace: ${createError?.message ?? "Unknown error"}`);
  return { userId: user.id, familyId: createdFamily.id, isDemo: false };
}
