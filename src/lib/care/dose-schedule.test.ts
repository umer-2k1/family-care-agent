import { describe, expect, it } from "vitest";
import { expectedDoseCount } from "./dose-schedule";

describe("expectedDoseCount", () => {
  it("creates 30 expected doses for a twice-daily 15-day plan", () => expect(expectedDoseCount(2, 15)).toBe(30));
  it("rejects unsafe schedule bounds", () => expect(() => expectedDoseCount(0, 15)).toThrow());
});
