export function expectedDoseCount(frequencyPerDay: number, durationDays: number) {
  if (!Number.isInteger(frequencyPerDay) || frequencyPerDay < 1 || frequencyPerDay > 12) throw new Error("Frequency must be an integer from 1 to 12.");
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) throw new Error("Duration must be an integer from 1 to 365.");
  return frequencyPerDay * durationDays;
}
