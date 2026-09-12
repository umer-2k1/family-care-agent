type CaregiverIdentityInput = {
  email?: string | null;
  googleName?: string | null;
  profileName?: string | null;
};

function nonEmpty(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function getCaregiverIdentity({ email, googleName, profileName }: CaregiverIdentityInput) {
  const name = nonEmpty(googleName) ?? nonEmpty(profileName) ?? nonEmpty(email) ?? "Caregiver";
  const initials = name[0]?.toUpperCase() ?? "C";

  return { name, initials, detail: nonEmpty(email) ?? "Signed-in caregiver" };
}
