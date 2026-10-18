import { extractIncomingWhatsAppMessages, verifyWhatsAppSignature } from "@/lib/whatsapp/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  answerWhatsAppCareMessage,
  sendWhatsAppText,
} from "@/server/services/whatsapp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const verified =
    url.searchParams.get("hub.mode") === "subscribe" &&
    url.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN;
  return verified
    ? new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 })
    : new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWhatsAppSignature(raw, request.headers.get("x-hub-signature-256"), process.env.META_APP_SECRET)) return new Response("Unauthorized", { status: 401 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  for (const message of extractIncomingWhatsAppMessages(payload)) {
    const { error } = await supabase.from("whatsapp_inbound_messages").insert({ meta_message_id: message.id, body: message.body });
    if (error?.code === "23505") continue;
    if (error) throw error;
    const { data: connection } = await supabase.from("whatsapp_connections").select("id,phone_e164").eq("wa_id", message.from).eq("status", "connected").maybeSingle();
    if (!connection) continue;
    await supabase.from("whatsapp_inbound_messages").update({ connection_id: connection.id }).eq("meta_message_id", message.id);
    const response = await answerWhatsAppCareMessage(message.from, message.body, message.contextMessageId);
    await sendWhatsAppText(connection.phone_e164, response);
    await supabase.from("whatsapp_inbound_messages").update({ processed_at: new Date().toISOString() }).eq("meta_message_id", message.id);
  }
  return Response.json({ ok: true });
}
