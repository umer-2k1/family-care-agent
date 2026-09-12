import { z } from "zod";

export const healthRecordTypes = ["prescription", "lab_report", "vaccination", "discharge_summary", "doctor_note", "imaging_report", "other", "unknown"] as const;

export const recordUnderstandingSchema = z.object({
  recordType: z.enum(healthRecordTypes),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  medications: z.array(z.object({ name: z.string(), dose: z.number().positive(), unit: z.string(), frequencyPerDay: z.number().int().min(1).max(12), durationDays: z.number().int().positive(), instructions: z.string() })).default([]),
  followUps: z.array(z.object({ title: z.string(), dueText: z.string() })).default([]),
  requiresUserClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
});

export type RecordUnderstandingResult = z.infer<typeof recordUnderstandingSchema>;
