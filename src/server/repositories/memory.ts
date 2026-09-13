import { demoMemories } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import type { MemoryRecord } from "@/types/care";

export async function listMemberMemories(memberId: string): Promise<MemoryRecord[]> {
  const context = await requireCareContext();
  if (context.isDemo) return demoMemories.filter((memory) => memory.memberId === memberId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("memory_references").select("id,care_episode_id,category,content,source_type,source_id,created_at").eq("family_member_id", memberId).order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load memory: ${error.message}`);
  return (data ?? []).map((row) => ({ id: row.id, memberId, episodeId: row.care_episode_id ?? undefined, category: row.category as "episodic" | "semantic", text: row.content, sourceType: row.source_type as "record" | "message" | "care_action", sourceId: row.source_id, createdAt: row.created_at }));
}
