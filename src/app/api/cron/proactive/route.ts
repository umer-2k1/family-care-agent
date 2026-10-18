import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";

export async function GET(request: Request) {
  if (isDemoMode()) return Response.json({ insights: [{ memberId: "emma", message: "Emma's follow-up is due in 3 days and is not scheduled.", type: "unscheduled_follow_up" }], mode: "demo" });

  try {
    const authHeader = request.headers.get("authorization");
    const isCron = Boolean(process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
    const supabase = isCron ? createSupabaseAdminClient() : await createSupabaseServerClient();
    if (!isCron) await requireCareContext();

    const now = new Date();
    const due = new Date(now.getTime() + 3 * 86_400_000);
    const { data, error } = await supabase
      .from("follow_ups")
      .select("id,title,due_at,family_member_id,family_members(name)")
      .eq("status", "pending")
      .is("google_calendar_event_id", null)
      .gte("due_at", now.toISOString())
      .lte("due_at", due.toISOString());
    if (error) throw error;

    const insights = (data ?? []).map((followUp) => ({
      followUpId: followUp.id,
      memberId: followUp.family_member_id,
      message: `${Array.isArray(followUp.family_members) ? followUp.family_members[0]?.name : "Family member"}'s ${followUp.title} is due soon and is not scheduled.`,
      type: "unscheduled_follow_up",
    }));
    return Response.json({ insights, mode: isCron ? "cron" : "user" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proactive check failed.";
    const status = /auth|session|sign in|authenticated/i.test(message) ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
