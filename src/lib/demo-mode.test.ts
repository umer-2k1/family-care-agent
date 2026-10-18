import { afterEach, describe, expect, it } from "vitest";
import { isDemoMode } from "./demo-mode";

const originalValue = process.env.NEXT_PUBLIC_DEMO_MODE;

afterEach(() => {
  if (originalValue === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
  else process.env.NEXT_PUBLIC_DEMO_MODE = originalValue;
});

describe("isDemoMode", () => {
  it("requires explicit opt-in", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    expect(isDemoMode()).toBe(false);
  });

  it("enables demo mode only for true", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
  });
});
