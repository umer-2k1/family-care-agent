import { describe, expect, it } from "vitest";
import { getCaregiverIdentity } from "./caregiver-identity";

describe("getCaregiverIdentity", () => {
  it("prefers the signed-in Google name over stored fallback data", () => {
    expect(getCaregiverIdentity({ googleName: "Nadia Ahmed", profileName: "Maya Khan", email: "nadia@example.com" })).toEqual({
      name: "Nadia Ahmed",
      initials: "N",
      detail: "nadia@example.com",
    });
  });

  it("uses an email when no provider name is available", () => {
    expect(getCaregiverIdentity({ email: "caregiver@example.com" })).toEqual({
      name: "caregiver@example.com",
      initials: "C",
      detail: "caregiver@example.com",
    });
  });
});
