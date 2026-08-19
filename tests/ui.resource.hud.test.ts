import { describe, it, expect } from "vitest";
import { formatResourceHUDText } from "../src/ui/HUDState";

describe("Resource HUD Formatting", () => {
  it("should format energy, wood, and iron correctly", () => {
    const text = formatResourceHUDText(45, 100, 12, 6);
    expect(text).toBe("⚡ Energy: 45/100  |  🪵 Wood: 12  |  ⛏️ Iron: 6");
  });

  it("should floor floating numbers cleanly", () => {
    const text = formatResourceHUDText(45.9, 100.2, 12.8, 6.1);
    expect(text).toBe("⚡ Energy: 45/100  |  🪵 Wood: 12  |  ⛏️ Iron: 6");
  });

  it("should clamp negative numbers to 0", () => {
    const text = formatResourceHUDText(-5, 100, -2, -10);
    expect(text).toBe("⚡ Energy: 0/100  |  🪵 Wood: 0  |  ⛏️ Iron: 0");
  });

  it("should format energy, wood with capacity, and iron with capacity when provided", () => {
    const text = formatResourceHUDText(45, 100, 12, 6, 50, 25);
    expect(text).toBe("⚡ Energy: 45/100  |  🪵 Wood: 12/50  |  ⛏️ Iron: 6/25");
  });
});
