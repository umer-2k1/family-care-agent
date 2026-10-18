import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invokeWhatsAppCareGraph } from "@/lib/ai/langgraph/whatsapp-care-graph";

type NotificationKind = "pre_dose" | "overdue_followup";

function config() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId)
    throw new Error("WhatsApp Cloud API is not configured.");
  return {
    token,
    phoneNumberId,
    version: process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0",
  };
}

async function sendMetaMessage(to: string, payload: Record<string, unknown>) {
  const settings = config();
  const response = await fetch(
    `https://graph.facebook.com/${settings.version}/${settings.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${settings.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        ...payload,
      }),
    },
  );
  const data = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(data.error?.message ?? "WhatsApp rejected the message.");
  return data.messages?.[0]?.id ?? null;
}

export async function sendWhatsAppGreeting(phone: string) {
  const template = process.env.WHATSAPP_GREETING_TEMPLATE ?? "hello_world";
  return sendMetaMessage(phone, {
    type: "template",
    template: {
      name: template,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US" },
    },
  });
}

export async function sendWhatsAppText(phone: string, body: string) {
  return sendMetaMessage(phone, { type: "text", text: { body } });
}

export async function enqueueWhatsAppNotifications(
  connectionId: string,
  familyId: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data: doses, error } = await supabase
    .from("medication_doses")
    .select(
      "id,scheduled_at,medications!inner(care_episodes!inner(family_members!inner(family_id)))",
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString());
  if (error) throw error;
  const jobs = (doses ?? []).flatMap((dose) => {
    const member = (
      dose as unknown as {
        medications: {
          care_episodes: { family_members: { family_id: string } };
        };
      }
    ).medications.care_episodes.family_members;
    if (member.family_id !== familyId) return [];
    const at = new Date(dose.scheduled_at).getTime();
    return [
      {
        dose_id: dose.id,
        connection_id: connectionId,
        kind: "pre_dose" as NotificationKind,
        scheduled_for: new Date(at - 15 * 60_000).toISOString(),
      },
      {
        dose_id: dose.id,
        connection_id: connectionId,
        kind: "overdue_followup" as NotificationKind,
        scheduled_for: new Date(at + 60 * 60_000).toISOString(),
      },
    ];
  });
  if (jobs.length) {
    const { error: insertError } = await supabase
      .from("whatsapp_dose_notifications")
      .upsert(jobs, {
        onConflict: "dose_id,connection_id,kind",
        ignoreDuplicates: true,
      });
    if (insertError) throw insertError;
  }
  return jobs.length;
}

export async function dispatchWhatsAppNotification(notificationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: job, error } = await supabase
    .from("whatsapp_dose_notifications")
    .select("id,dose_id,connection_id,kind,status")
    .eq("id", notificationId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  if (!job) return { sent: false, reason: "not_pending" };
  await supabase
    .from("whatsapp_dose_notifications")
    .update({ status: "processing" })
    .eq("id", job.id)
    .eq("status", "pending");
  const [{ data: dose }, { data: connection }] = await Promise.all([
    supabase
      .from("medication_doses")
      .select(
        "id,status,scheduled_at,medications!inner(name,dose,unit,care_episodes!inner(family_members!inner(name)))",
      )
      .eq("id", job.dose_id)
      .maybeSingle(),
    supabase
      .from("whatsapp_connections")
      .select("phone_e164,status")
      .eq("id", job.connection_id)
      .maybeSingle(),
  ]);
  if (
    !dose ||
    dose.status !== "scheduled" ||
    !connection ||
    connection.status !== "connected"
  ) {
    await supabase
      .from("whatsapp_dose_notifications")
      .update({ status: "cancelled" })
      .eq("id", job.id);
    return { sent: false, reason: "cancelled" };
  }
  const medication = (
    dose as unknown as {
      medications: {
        name: string;
        dose: number;
        unit: string;
        care_episodes: { family_members: { name: string } };
      };
    }
  ).medications;
  const patient = medication.care_episodes.family_members.name;
  const body =
    job.kind === "pre_dose"
      ? `💊 Medication reminder\n${patient}'s ${medication.name} ${medication.dose}${medication.unit} is due in 15 minutes. Reply Taken, Missed, or Skipped.`
      : `Hi, was ${patient}'s ${medication.name} dose given? Reply Taken, Missed, or Skipped.`;
  try {
    const messageId = await sendWhatsAppText(connection.phone_e164, body);
    await supabase
      .from("whatsapp_dose_notifications")
      .update({
        status: "sent",
        meta_message_id: messageId,
        sent_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return { sent: true, messageId };
  } catch (cause) {
    await supabase
      .from("whatsapp_dose_notifications")
      .update({
        status: "failed",
        last_error:
          cause instanceof Error ? cause.message : "WhatsApp send failed",
      })
      .eq("id", job.id);
    throw cause;
  }
}

export async function answerWhatsAppCareMessage(senderId: string, text: string, contextMessageId?: string) {
  const supabase = createSupabaseAdminClient();
  const { data: connection } = await supabase
    .from("whatsapp_connections")
    .select("id")
    .eq("wa_id", senderId)
    .eq("status", "connected")
    .maybeSingle();
  if (!connection)
    return "This WhatsApp number is not connected to Care Memory.";
  const result = await invokeWhatsAppCareGraph(senderId, text, connection.id, contextMessageId);
  return result.response;
}
