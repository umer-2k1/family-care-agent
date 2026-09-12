import { describe, expect, it } from "vitest";
import { routeCareIntent } from "./care-agent";

describe("routeCareIntent", () => {
  it("routes a reported symptom to a health event", () => {
    expect(routeCareIntent("Emma developed a rash today.")).toBe("add_health_event");
  });
});
