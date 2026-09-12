import { describe, expect, it } from "vitest";
import { findMentionedCaregiver, requestedDoseStatus, selectRequestedDose } from "./dose-selection";

const doses = [
  { id: "morning", scheduledAt: "2026-09-06T08:00:00", status: "scheduled" },
  { id: "evening", scheduledAt: "2026-09-06T20:00:00", status: "scheduled" },
];

describe("dose message selection", () => {
  it("selects the requested time and state", () => {
    expect(selectRequestedDose(doses, "Dad gave the evening medicine")?.id).toBe("evening");
    expect(requestedDoseStatus("We missed the morning medicine")).toBe("missed");
    expect(requestedDoseStatus("The doctor said to hold this dose")).toBe("skipped");
  });

  it("resolves a caregiver by name or relationship", () => {
    const caregivers = [{ id: "1", name: "Ahmed", relationship: "Dad" }];
    expect(findMentionedCaregiver(caregivers, "Dad gave Emma medicine")?.id).toBe("1");
  });
});
