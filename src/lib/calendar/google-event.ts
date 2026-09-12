export function googleApiStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { code?: unknown; response?: { status?: unknown } };
  if (typeof candidate.response?.status === "number") return candidate.response.status;
  return typeof candidate.code === "number" ? candidate.code : undefined;
}

export function isMissingGoogleEvent(error: unknown) {
  const status = googleApiStatus(error);
  return status === 404 || status === 410;
}

export function isExistingGoogleEvent(error: unknown) {
  return googleApiStatus(error) === 409;
}

export function isGoogleCalendarRateLimit(error: unknown) {
  const status = googleApiStatus(error);
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  return status === 429 || (status === 403 && /rate limit|quota/i.test(message));
}

export function safeGoogleCalendarUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const isGoogleHost = url.hostname === "google.com" || url.hostname.endsWith(".google.com");
    return url.protocol === "https:" && isGoogleHost ? url : null;
  } catch {
    return null;
  }
}

type FollowUpCalendarDetails = {
  title: string;
  memberName: string;
  medication?: { name: string; dose: number; unit: string; frequencyPerDay: number; durationDays: number; instructions: string | null } | null;
};

type DoseCalendarDetails = {
  memberName: string;
  medication: { name: string; dose: number; unit: string; frequencyPerDay: number; durationDays: number; instructions: string | null };
  status: string;
};

export function buildFollowUpCalendarDetails({ title, memberName, medication }: FollowUpCalendarDetails) {
  const description = [`Family member: ${memberName}`];
  if (medication) {
    description.push(`Medication: ${medication.name} ${medication.dose} ${medication.unit}`);
    description.push(`Schedule: ${medication.frequencyPerDay} times daily for ${medication.durationDays} days`);
    if (medication.instructions) description.push(`Instructions: ${medication.instructions}`);
  }
  description.push("Follow-up created by Care Memory.");
  return { summary: `${memberName}: ${title}`, description: description.join("\n") };
}

export function buildDoseCalendarDetails({ memberName, medication, status }: DoseCalendarDetails) {
  const description = [
    `Family member: ${memberName}`,
    `Medication: ${medication.name} ${medication.dose} ${medication.unit}`,
    `Schedule: ${medication.frequencyPerDay} times daily for ${medication.durationDays} days`,
  ];
  if (medication.instructions) description.push(`Instructions: ${medication.instructions}`);
  description.push(`Care Memory status: ${status}`, "Medication dose created by Care Memory.");
  return { summary: `${memberName}: ${medication.name} ${medication.dose} ${medication.unit} dose [${status}]`, description: description.join("\n") };
}

export function doseCalendarEventId(doseId: string) {
  return `d${doseId.replaceAll("-", "").toLowerCase()}`;
}

export function relatedMemberName(value: unknown) {
  const relation = Array.isArray(value) ? value[0] : value;
  if (typeof relation !== "object" || relation === null || !("name" in relation)) return "Family member";
  const name = (relation as { name?: unknown }).name;
  return typeof name === "string" && name.trim() ? name.trim() : "Family member";
}
