import { completeWithFallback } from "@/lib/ai/models/provider";
import { recordUnderstandingSchema } from "@/lib/ai/schemas/record-understanding";

const prompt = `Classify and extract this family health record. Return JSON only with recordType, confidence from 0 to 1, summary, medications (name, numeric dose, unit, frequencyPerDay, durationDays, instructions), followUps (title, dueText), requiresUserClarification, and optional clarificationQuestion. Never diagnose. Use unknown and request clarification when uncertain.`;

export async function understandHealthRecord(file: File) {
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const output = await completeWithFallback("record_understanding", { prompt, media: { mimeType: file.type, data }, json: true });
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { throw new Error("The model did not return valid JSON."); }
  return recordUnderstandingSchema.parse(parsed);
}
