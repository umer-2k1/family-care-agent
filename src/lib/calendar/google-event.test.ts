import { describe, expect, it } from "vitest";
import { buildDoseCalendarDetails, buildFollowUpCalendarDetails, doseCalendarEventId, isExistingGoogleEvent, isGoogleCalendarRateLimit, isMissingGoogleEvent, relatedMemberName, safeGoogleCalendarUrl } from "./google-event";

describe("Google Calendar event handling", () => {
  it("recognizes stale stored event responses", () => {
    expect(isMissingGoogleEvent({ response: { status: 404 } })).toBe(true);
    expect(isMissingGoogleEvent({ code: 410 })).toBe(true);
    expect(isMissingGoogleEvent({ response: { status: 401 } })).toBe(false);
    expect(isExistingGoogleEvent({ response: { status: 409 } })).toBe(true);
  });

  it("only allows trusted Google event links", () => {
    expect(String(safeGoogleCalendarUrl("https://www.google.com/calendar/event?eid=test"))).toContain("google.com/calendar/event");
    expect(safeGoogleCalendarUrl("https://example.com/calendar/event")).toBeNull();
    expect(safeGoogleCalendarUrl("javascript:alert(1)")).toBeNull();
  });

  it("includes the family member and medication context", () => {
    expect(buildFollowUpCalendarDetails({
      title: "Pediatrician review",
      memberName: "John",
      medication: { name: "Amoxicillin", dose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15, instructions: "After meals" },
    })).toEqual({
      summary: "John: Pediatrician review",
      description: "Family member: John\nMedication: Amoxicillin 5 ml\nSchedule: 2 times daily for 15 days\nInstructions: After meals\nFollow-up created by Care Memory.",
    });
  });

  it("builds a deterministic dose event with complete care context", () => {
    const medication = { name: "Amoxicillin", dose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15, instructions: "After meals" };
    expect(buildDoseCalendarDetails({ memberName: "John", medication, status: "scheduled" })).toEqual({
      summary: "John: Amoxicillin 5 ml dose [scheduled]",
      description: "Family member: John\nMedication: Amoxicillin 5 ml\nSchedule: 2 times daily for 15 days\nInstructions: After meals\nCare Memory status: scheduled\nMedication dose created by Care Memory.",
    });
    expect(doseCalendarEventId("55c02537-15ea-4d23-9168-f519fac5e6a5")).toBe("d55c0253715ea4d239168f519fac5e6a5");
    expect(buildDoseCalendarDetails({ memberName: "John", medication, status: "taken" }).description).toContain("Care Memory status: taken");
  });

  it("reads member names from singular and array Supabase relations", () => {
    expect(relatedMemberName({ name: "John" })).toBe("John");
    expect(relatedMemberName([{ name: "Emma" }])).toBe("Emma");
    expect(relatedMemberName(null)).toBe("Family member");
  });

  it("recognizes retryable Google Calendar write limits", () => {
    expect(isGoogleCalendarRateLimit({ response: { status: 429 } })).toBe(true);
    expect(isGoogleCalendarRateLimit(Object.assign(new Error("Rate Limit Exceeded"), { code: 403 }))).toBe(true);
    expect(isGoogleCalendarRateLimit(Object.assign(new Error("Forbidden"), { code: 403 }))).toBe(false);
  });
});
