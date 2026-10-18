import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCareContext } from "@/server/auth/require-care-context";
import { dispatchWhatsAppNotification } from "@/server/services/whatsapp";
import { z } from "zod";

const schema = z.object({ kind: z.enum(["pre_dose", "overdue_followup"]) });
export async function POST(request: Request) {
  const input = schema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "Invalid demo action." }, { status: 400 });
  if (process.env.WHATSAPP_DEMO_CONTROLS !== "true") return Response.json({ error: "WhatsApp demo controls are disabled." }, { status: 403 });
  try {
    const context = await requireCareContext();
    if (context.isDemo) return Response.json({ error: "Use configured mode for real WhatsApp messages." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { data: connection } = await supabase.from("whatsapp_connections").select("id").eq("user_id", context.userId).eq("status", "connected").maybeSingle();
    if (!connection) return Response.json({ error: "Connect WhatsApp first." }, { status: 400 });
    const { data: job } = await supabase.from("whatsapp_dose_notifications").select("id").eq("connection_id", connection.id).eq("kind", input.data.kind).eq("status", "pending").order("scheduled_for", { ascending: true }).limit(1).maybeSingle();
    if (!job) return Response.json({ error: "No pending test notification is available." }, { status: 404 });
    const result = await dispatchWhatsAppNotification(job.id);
    return Response.json(result);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to send WhatsApp test message." }, { status: 500 }); }
}
