import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest, isPublicPath } from "./routing";

describe("isPublicPath", () => {
  it("allows authentication infrastructure", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("keeps application and mutation routes protected", () => {
    expect(isPublicPath("/family")).toBe(false);
    expect(isPublicPath("/api/chat")).toBe(false);
  });
});

describe("isAuthorizedCronRequest", () => {
  it("only bypasses session middleware for the proactive route with the exact secret", () => {
    expect(isAuthorizedCronRequest("/api/cron/proactive", "Bearer secret", "secret")).toBe(true);
    expect(isAuthorizedCronRequest("/api/cron/proactive", "Bearer wrong", "secret")).toBe(false);
    expect(isAuthorizedCronRequest("/api/chat", "Bearer secret", "secret")).toBe(false);
    expect(isAuthorizedCronRequest("/api/cron/proactive", "Bearer secret")).toBe(false);
  });
});
