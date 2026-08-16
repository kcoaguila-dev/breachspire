import { describe, it, expect } from "vitest";
import { getAmbientLightingColor } from "../src/ecs/systems/DayNightSystem";

describe("DayNightSystem Ambient Lighting", () => {
    it("returns daylight values at progress 0.25", () => {
        const color = getAmbientLightingColor(0.25);
        expect(color.r).toBe(255);
        expect(color.g).toBe(255);
        expect(color.b).toBe(255);
        expect(color.alpha).toBe(0.0);
    });

    it("returns dusk values smoothly interpolating at 0.575 (mid-dusk)", () => {
        const color = getAmbientLightingColor(0.575);
        expect(color.r).toBe(255);
        expect(color.g).toBeCloseTo(197.5);
        expect(color.b).toBeCloseTo(157.5);
        expect(color.alpha).toBeCloseTo(0.125);
    });

    it("returns dark night values with high alpha at progress 0.85", () => {
        const color = getAmbientLightingColor(0.85);
        // t = (0.85 - 0.65) / 0.35 = 0.5714...
        // expected r: 255 + (10 - 255) * t = 255 - 140 = 115 (approx)
        // expected g: 140 + (12 - 140) * t = 140 - 73.1 = 66.8 (approx)
        // expected b: 60 + (35 - 60) * t = 60 - 14.28 = 45.7 (approx)
        // expected alpha: 0.25 + 0.4 * t = 0.478 (approx)
        expect(color.alpha).toBeGreaterThan(0.4);
        expect(color.r).toBeLessThan(150);
        expect(color.g).toBeLessThan(100);
        expect(color.b).toBeLessThan(100);
    });
});
