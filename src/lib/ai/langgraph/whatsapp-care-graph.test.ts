import { describe, expect, it } from "vitest";
import { whatsappThreadId } from "./whatsapp-thread";

describe("whatsappThreadId", () => {
  it("keeps one stable LangGraph thread per WhatsApp connection", () => {
    expect(whatsappThreadId("connection-123")).toBe("whatsapp:connection-123");
  });
});
