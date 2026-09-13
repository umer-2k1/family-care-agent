import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request) {
  const input = schema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "A valid Calendar setting is required." }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const { error } = await supabase.auth.updateUser({ data: { ...user.user_metadata, calendar_auto_sync: input.data.enabled } });
    if (error) throw error;
    console.info(`[settings] Calendar automation ${input.data.enabled ? "enabled" : "disabled"} userId=${user.id}`);
    return Response.json({ enabled: input.data.enabled });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Setting update failed." }, { status: 500 }); }
}
