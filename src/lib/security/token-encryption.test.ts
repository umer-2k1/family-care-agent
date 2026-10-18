import { afterEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./token-encryption";

const original = process.env.TOKEN_ENCRYPTION_KEY;
afterEach(() => { if (original === undefined) delete process.env.TOKEN_ENCRYPTION_KEY; else process.env.TOKEN_ENCRYPTION_KEY = original; });

describe("token encryption", () => {
  it("round trips without storing plaintext", () => {
    process.env.TOKEN_ENCRYPTION_KEY = "test-secret-that-is-at-least-thirty-two-characters";
    const encrypted = encryptToken("provider-token");
    expect(encrypted).not.toContain("provider-token");
    expect(decryptToken(encrypted)).toBe("provider-token");
  });
});
