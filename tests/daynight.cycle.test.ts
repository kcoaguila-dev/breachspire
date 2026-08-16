import { describe, it, expect } from "vitest";
import { computeDayNightPhase, computeWaveComposition } from "../src/ecs/systems/DayNightSystem";

describe("DayNightSystem — Pure Logic", () => {
    describe("computeDayNightPhase", () => {
        const DAY_DUR = 45000;
        const NIGHT_DUR = 30000;

        it("should return Day 1, Dawn (not night) at 0ms", () => {
            const result = computeDayNightPhase(0, DAY_DUR, NIGHT_DUR);
            expect(result.dayNumber).toBe(1);
            expect(result.isNight).toBe(false);
            expect(result.progress).toBe(0);
        });

        it("should return Day 1, Nightfall at exactly day duration", () => {
            const result = computeDayNightPhase(DAY_DUR, DAY_DUR, NIGHT_DUR);
            expect(result.dayNumber).toBe(1);
            expect(result.isNight).toBe(true);
            expect(result.progress).toBe(0);
        });

        it("should return Day 2, Dawn when cycle resets", () => {
            const result = computeDayNightPhase(DAY_DUR + NIGHT_DUR, DAY_DUR, NIGHT_DUR);
            expect(result.dayNumber).toBe(2);
            expect(result.isNight).toBe(false);
            expect(result.progress).toBe(0);
        });
    });

    describe("computeWaveComposition", () => {
        it("should generate basic goblins on day 1 with 3 floors", () => {
            const comp = computeWaveComposition(1, 3);
            expect(comp.goblinCount).toBe(3); // 2 + 1 = 3, multiplier = max(1, 3/3) = 1. So 3.
            expect(comp.archerCount).toBe(0);
            expect(comp.trollCount).toBe(0);
        });

        it("should scale up with higher day and introduce new enemies", () => {
            const comp = computeWaveComposition(3, 3);
            expect(comp.goblinCount).toBe(5); // 2+3
            expect(comp.archerCount).toBe(2); // 3-1
            expect(comp.trollCount).toBe(1);  // Math.floor(3/2)
        });

        it("should scale multiplier with floors", () => {
            const comp = computeWaveComposition(3, 6);
            // Multiplier = 6/3 = 2
            expect(comp.goblinCount).toBe(10);
            expect(comp.archerCount).toBe(4);
            expect(comp.trollCount).toBe(2);
        });
    });
});
