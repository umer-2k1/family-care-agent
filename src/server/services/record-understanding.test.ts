import { describe, expect, it } from "vitest";
import { normalizeRecordUnderstanding } from "../../lib/ai/schemas/normalize-record-understanding";
import { confirmedRecordUnderstandingSchema, recordUnderstandingSchema } from "../../lib/ai/schemas/record-understanding";

describe("normalizeRecordUnderstanding", () => {
  it("normalizes common model field aliases into the record contract", () => {
    const result = recordUnderstandingSchema.safeParse(normalizeRecordUnderstanding({
      recordType: "medical prescription",
      confidence: 0.98,
      summary: "Amoxicillin treatment.",
      medications: [{ name: "Amoxicillin", dosage: "5 ml", frequency: "twice daily", duration: "15 days", directions: "After meals", prescriptionDate: "2025-04-24" }],
      follow_ups: [{ title: "Pediatrician review", dueText: "in two weeks" }],
      requiresUserClarification: false,
      clarificationQuestion: null,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      recordType: "prescription",
      medications: [{ name: "Amoxicillin", dose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15, instructions: "After meals", startDate: "2025-04-24" }],
      clarificationQuestion: null,
    });
  });

  it("marks as-needed directions so they cannot become fixed reminders", () => {
    const result = recordUnderstandingSchema.parse(normalizeRecordUnderstanding({
      recordType: "prescription",
      confidence: 0.98,
      summary: "Paracetamol course.",
      medications: [{ name: "Paracetamol", dosage: "5 ml", frequency: "Every 6 hours as needed", duration: "3 days", directions: "After meals", prescriptionDate: "2026-09-12" }],
      followUps: [],
      requiresUserClarification: false,
    }));
    expect(result.medications[0]).toMatchObject({ dose: 5, unit: "ml", frequencyPerDay: 4, asNeeded: true });
    expect(confirmedRecordUnderstandingSchema.safeParse(result).success).toBe(false);
  });

  it("accepts an unknown record with missing medication details for user review", () => {
    const result = recordUnderstandingSchema.safeParse(normalizeRecordUnderstanding({
      summary: "A document was uploaded, but medication details were not found.",
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({ recordType: "unknown", medications: [], requiresUserClarification: true });
  });

  it("preserves a numericDose returned by the vision model", () => {
    const result = recordUnderstandingSchema.safeParse(normalizeRecordUnderstanding({
      recordType: "prescription",
      confidence: 0.98,
      summary: "Amoxicillin treatment.",
      medications: [{ name: "Amoxicillin", numericDose: 5, unit: "ml", frequencyPerDay: 2, durationDays: 15, instructions: "After meals", startDate: "2025-04-24" }],
      followUps: [],
      requiresUserClarification: false,
      clarificationQuestion: null,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.medications[0]?.dose).toBe(5);
  });
});
