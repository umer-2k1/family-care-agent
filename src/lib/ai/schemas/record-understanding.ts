import { z } from "zod";

export const healthRecordTypes = ["prescription", "lab_report", "vaccination", "discharge_summary", "doctor_note", "imaging_report", "other", "unknown"] as const;

const extractedMedicationSchema = z.object({
  name: z.string().trim().min(1).nullable().default(null),
  dose: z.number().positive().nullable().default(null),
  unit: z.string().trim().min(1).nullable().default(null),
  frequencyPerDay: z.number().int().min(1).max(12).nullable().default(null),
  durationDays: z.number().int().positive().nullable().default(null),
  instructions: z.string().trim().min(1).nullable().default(null),
  startDate: z.iso.date().nullable().default(null),
  asNeeded: z.boolean().default(false),
});

const extractedFollowUpSchema = z.object({
  title: z.string().trim().min(1).nullable().default(null),
  dueText: z.string().trim().min(1).nullable().default(null),
});

export const confirmedFollowUpSchema = extractedFollowUpSchema.extend({
  title: z.string().trim().min(1),
  dueText: z.string().trim().min(1),
});

export const confirmedMedicationSchema = extractedMedicationSchema.extend({
  name: z.string().trim().min(1),
  dose: z.number().positive(),
  unit: z.string().trim().min(1),
  frequencyPerDay: z.number().int().min(1).max(12),
  durationDays: z.number().int().positive(),
  instructions: z.string().trim().min(1),
  startDate: z.iso.date(),
  asNeeded: z.literal(false),
});

export const recordUnderstandingSchema = z.object({
  recordType: z.enum(healthRecordTypes).default("unknown"),
  confidence: z.number().min(0).max(1).default(0),
  summary: z.string().trim().min(1).default("No summary was extracted from this record."),
  medications: z.array(extractedMedicationSchema).default([]),
  followUps: z.array(extractedFollowUpSchema).default([]),
  requiresUserClarification: z.boolean().default(true),
  clarificationQuestion: z.string().trim().min(1).nullable().default(null),
});

export const confirmedRecordUnderstandingSchema = recordUnderstandingSchema.extend({
  medications: z.array(confirmedMedicationSchema).min(1),
});

export type RecordUnderstandingResult = z.infer<typeof recordUnderstandingSchema>;
