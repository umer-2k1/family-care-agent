import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest, isPublicPath, safeLocalRedirect } from "./routing";

describe("isPublicPath", () => {
  it("allows authentication infrastructure", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/auth/calendar-complete")).toBe(true);
  });

  it("keeps application and mutation routes protected", () => {
    expect(isPublicPath("/family")).toBe(false);
    expect(isPublicPath("/api/chat")).toBe(false);
  });
});

describe("safeLocalRedirect", () => {
  it("allows local application paths and rejects external redirects", () => {
    expect(safeLocalRedirect("/api/calendar/google?followUpId=123")).toContain("/api/calendar/google");
    expect(safeLocalRedirect("https://example.com")).toBe("/");
    expect(safeLocalRedirect("//example.com")).toBe("/");
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
