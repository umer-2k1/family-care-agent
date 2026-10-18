type ScheduledDose = { id: string; scheduledAt: string; status: string };
type CaregiverCandidate = { id: string; name: string; relationship: string };

export function requestedDoseStatus(message: string): "taken" | "missed" | "skipped" {
  const normalized = message.toLowerCase();
  if (/\b(missed|forgot|not given)\b/.test(normalized)) return "missed";
  if (/\b(skip|skipped|hold|held)\b/.test(normalized)) return "skipped";
  return "taken";
}

export function selectRequestedDose(doses: ScheduledDose[], message: string) {
  const scheduled = doses
    .filter((dose) => dose.status === "scheduled")
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());
  const normalized = message.toLowerCase();
  const wantsMorning = /\b(morning|am)\b/.test(normalized);
  const wantsEvening = /\b(evening|night|pm)\b/.test(normalized);
  if (!wantsMorning && !wantsEvening) return scheduled[0];
  return scheduled.find((dose) => {
    const hour = new Date(dose.scheduledAt).getHours();
    return wantsMorning ? hour < 12 : hour >= 12;
  }) ?? scheduled[0];
}

export function findMentionedCaregiver(candidates: CaregiverCandidate[], message: string) {
  const normalized = message.toLowerCase();
  return candidates.find((candidate) => [candidate.name, candidate.relationship]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .some((value) => normalized.includes(value)));
}
