import { completeWithFallback } from "@/lib/ai/models/provider";
import { normalizeRecordUnderstanding } from "@/lib/ai/schemas/normalize-record-understanding";
import { recordUnderstandingSchema } from "@/lib/ai/schemas/record-understanding";
import { z } from "zod";

const prompt = `Classify and extract this family health record. Return JSON only with recordType, confidence from 0 to 1, summary, medications (name, dose as a number, unit, frequencyPerDay, durationDays, instructions, startDate as YYYY-MM-DD, asNeeded as a boolean), followUps (title, dueText), requiresUserClarification, and optional clarificationQuestion. Use the prescription or course date as startDate. Set asNeeded true for PRN or "as needed" directions; those must not become fixed dose reminders. Never diagnose. Use unknown and request clarification when uncertain.`;

export async function understandHealthRecord(file: File) {
  console.info("[records] Starting AI record understanding", { fileName: file.name, mimeType: file.type, sizeBytes: file.size });
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const output = await completeWithFallback("record_understanding", { prompt, media: { mimeType: file.type, data }, json: true });
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch {
    console.error("[records] AI record understanding returned invalid JSON");
    throw new Error("We could not read this record. Please try a clearer image or PDF.");
  }
  const normalized = normalizeRecordUnderstanding(parsed);
  const result = recordUnderstandingSchema.safeParse(normalized);
  if (!result.success) {
    console.error("[records] AI record understanding did not match the expected format", { issues: z.flattenError(result.error) });
    throw new Error("We could not confidently read this record. Please try a clearer image or PDF.");
  }
  console.info("[records] AI record understanding completed", { recordType: result.data.recordType, medicationCount: result.data.medications.length, requiresUserClarification: result.data.requiresUserClarification });
  return result.data;
}
