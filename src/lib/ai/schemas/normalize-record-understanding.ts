function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = asString(value)?.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function normalizeRecordType(value: unknown) {
  const type = asString(value)?.toLowerCase().replaceAll(/[\s-]+/g, "_");
  if (!type) return value;
  if (type.includes("prescription")) return "prescription";
  if (type.includes("lab")) return "lab_report";
  if (type.includes("vaccin")) return "vaccination";
  if (type.includes("discharge")) return "discharge_summary";
  if (type.includes("doctor") || type.includes("clinical_note")) return "doctor_note";
  if (type.includes("imaging") || type.includes("radiology")) return "imaging_report";
  return type;
}

function frequencyPerDay(value: unknown) {
  const text = asString(value)?.toLowerCase();
  const hourly = text?.match(/every\s+(\d+(?:\.\d+)?)\s*hours?/);
  if (hourly) return Math.round(24 / Number(hourly[1]));
  if (text?.includes("twice") || text?.includes("two times")) return 2;
  if (text?.includes("three times")) return 3;
  if (text?.includes("once") || text?.includes("daily")) return 1;
  const number = asNumber(value);
  if (number) return number;
  return value;
}

export function normalizeRecordUnderstanding(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) return value;
  const medications = Array.isArray(record.medications) ? record.medications.map((item) => {
    const medication = asRecord(item);
    if (!medication) return item;
    const doseValue = medication.dose ?? medication.numericDose ?? medication.dosage ?? medication.doseAmount ?? medication.amount;
    const doseText = asString(doseValue);
    const frequencyValue = medication.frequencyPerDay ?? medication.frequency;
    const scheduleText = `${asString(frequencyValue) ?? ""} ${asString(medication.instructions ?? medication.direction ?? medication.directions) ?? ""}`;
    return {
      ...medication,
      dose: asNumber(doseValue),
      unit: medication.unit ?? doseText?.match(/[a-zA-Z]+/)?.[0],
      frequencyPerDay: frequencyPerDay(frequencyValue),
      durationDays: asNumber(medication.durationDays ?? medication.duration),
      instructions: medication.instructions ?? medication.direction ?? medication.directions,
      startDate: medication.startDate ?? medication.start_date ?? medication.prescriptionDate ?? record.recordDate ?? record.date,
      asNeeded: medication.asNeeded ?? medication.prn ?? /\bas needed\b|\bprn\b/i.test(scheduleText),
    };
  }) : record.medications;

  return {
    ...record,
    recordType: normalizeRecordType(record.recordType ?? record.record_type ?? record.type) ?? undefined,
    confidence: record.confidence ?? undefined,
    summary: record.summary ?? undefined,
    medications,
    followUps: record.followUps ?? record.follow_ups ?? [],
    requiresUserClarification: record.requiresUserClarification ?? record.requires_user_clarification ?? undefined,
    clarificationQuestion: record.clarificationQuestion ?? record.clarification_question ?? undefined,
  };
}
