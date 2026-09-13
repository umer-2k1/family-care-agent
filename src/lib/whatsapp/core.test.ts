import { describe, expect, it } from "vitest";
import { normalizeWhatsAppNumber, verifyWhatsAppSignature } from "./core";
import { createHmac } from "node:crypto";

describe("WhatsApp core", () => {
  it("normalizes an E.164 test recipient", () => expect(normalizeWhatsAppNumber("+92 300-1234567")).toBe("+923001234567"));
  it("rejects invalid webhook signatures", () => { const body = '{"ok":true}'; const signature = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`; expect(verifyWhatsAppSignature(body, signature, "secret")).toBe(true); expect(verifyWhatsAppSignature(body, signature, "wrong")).toBe(false); });
});
