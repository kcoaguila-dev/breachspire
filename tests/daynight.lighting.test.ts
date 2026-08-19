import { describe, it, expect } from "vitest";
import { getAmbientLightingColor, isBloodMoonDay } from "../src/ecs/systems/DayNightSystem";

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
        expect(color.alpha).toBeGreaterThan(0.4);
        expect(color.r).toBeLessThan(150);
        expect(color.g).toBeLessThan(100);
        expect(color.b).toBeLessThan(100);
    });

    it("identifies Blood Moon days correctly (every 4th day starting day 4)", () => {
        expect(isBloodMoonDay(1)).toBe(false);
        expect(isBloodMoonDay(2)).toBe(false);
        expect(isBloodMoonDay(3)).toBe(false);
        expect(isBloodMoonDay(4)).toBe(true);
        expect(isBloodMoonDay(5)).toBe(false);
        expect(isBloodMoonDay(8)).toBe(true);
        expect(isBloodMoonDay(12)).toBe(true);
    });

    it("returns crimson Blood Moon lighting when isBloodMoon is true at night", () => {
        const bloodColor = getAmbientLightingColor(0.85, true);
        expect(bloodColor.r).toBe(255);
        expect(bloodColor.g).toBeLessThan(30);
        expect(bloodColor.b).toBeLessThan(40);
        expect(bloodColor.alpha).toBeGreaterThan(0.5);
    });
});
