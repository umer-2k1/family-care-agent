import { getMemoryProvider } from "@/lib/memory";
import type { AddMemoryInput } from "@/lib/memory/provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function writeMemorySafely(input: AddMemoryInput) {
  const supabase = await createSupabaseServerClient();
  const providerName = process.env.MEMORY_PROVIDER === "mem0" ? "mem0" : "cognee";
  const pendingProviderId = `pending-${crypto.randomUUID()}`;
  const { data: reference, error: referenceError } = await supabase
    .from("memory_references")
    .insert({
      family_member_id: input.memberId,
      care_episode_id: input.episodeId ?? null,
      provider: providerName,
      provider_memory_id: pendingProviderId,
      category: input.category,
      content: input.text,
      source_type: input.sourceType,
      source_id: input.sourceId,
    })
    .select("id")
    .single();

  if (referenceError) {
    return { success: false, persisted: false, error: referenceError.message };
  }

  try {
    const memory = await getMemoryProvider().addMemory(input);
    const { error: updateError } = await supabase
      .from("memory_references")
      .update({ provider_memory_id: memory.id })
      .eq("id", reference.id);
    if (updateError) return { success: false, persisted: true, memory, error: updateError.message };
    return { success: true, persisted: true, memory };
  } catch (error) {
    return { success: false, persisted: true, error: error instanceof Error ? error.message : "Memory write failed." };
  }
}
