import { createHmac, timingSafeEqual } from "node:crypto";

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(digits)) throw new Error("Enter a valid WhatsApp number in international format, for example +923001234567.");
  return digits;
}

export function whatsappIdFromNumber(phone: string) { return normalizeWhatsAppNumber(phone).slice(1); }

export function verifyWhatsAppSignature(rawBody: string, signature: string | null, appSecret: string | undefined) {
  if (!signature || !appSecret || !signature.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export type IncomingWhatsAppMessage = { id: string; from: string; body: string; contextMessageId?: string };
type MetaMessage = { id?: string; from?: string; type?: string; text?: { body?: string }; context?: { id?: string } };
type MetaPayload = { entry?: Array<{ changes?: Array<{ value?: { messages?: MetaMessage[] } }> }> };

export function extractIncomingWhatsAppMessages(payload: unknown): IncomingWhatsAppMessage[] {
  const root = payload as MetaPayload;
  return root.entry?.flatMap((entry) => entry.changes?.flatMap((change) => (change.value?.messages ?? []).flatMap((message) => message.type === "text" && message.id && message.from && message.text?.body ? [{ id: message.id, from: message.from, body: message.text.body, contextMessageId: message.context?.id }] : [])) ?? []) ?? [];
}
