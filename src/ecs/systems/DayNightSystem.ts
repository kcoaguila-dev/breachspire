import { defineQuery, IWorld } from "bitecs";
import { DayNightCycle } from "../components";

const dayNightQuery = defineQuery([DayNightCycle]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function getAmbientLightingColor(cycleProgress: number): { r: number, g: number, b: number, alpha: number } {
    if (cycleProgress < 0.5) {
        return { r: 255, g: 255, b: 255, alpha: 0.0 };
    } else if (cycleProgress < 0.65) {
        const t = (cycleProgress - 0.5) / 0.15;
        return {
            r: 255 + (255 - 255) * t,
            g: 255 + (140 - 255) * t,
            b: 255 + (60 - 255) * t,
            alpha: 0.0 + (0.25 - 0.0) * t
        };
    } else {
        const t = (cycleProgress - 0.65) / 0.35;
        return {
            r: 255 + (10 - 255) * t,
            g: 140 + (12 - 140) * t,
            b: 60 + (35 - 60) * t,
            alpha: 0.25 + (0.65 - 0.25) * t
        };
    }
}

export function computeDayNightPhase(elapsedTime: number, dayDuration: number, nightDuration: number): { isNight: boolean, progress: number, dayNumber: number } {
    const cycleDuration = dayDuration + nightDuration;
    // Assume we start at Day 1
    const totalCycles = Math.floor(elapsedTime / cycleDuration);
    const dayNumber = totalCycles + 1;

    const timeInCurrentCycle = elapsedTime % cycleDuration;

    const isNight = timeInCurrentCycle >= dayDuration;

    let progress = 0;
    if (isNight) {
        progress = (timeInCurrentCycle - dayDuration) / nightDuration;
    } else {
        progress = timeInCurrentCycle / dayDuration;
    }

    return { isNight, progress, dayNumber };
}

export function computeWaveComposition(dayNumber: number, spireFloors: number): { goblinCount: number, archerCount: number, trollCount: number } {
    // Wave 1: 2-3 goblins (let's use dayNumber for wave intensity logic, and spireFloors can boost it)
    // Here dayNumber represents the wave/cycle number

    let goblinCount = 2 + dayNumber; // scales up each day
    let archerCount = dayNumber > 1 ? dayNumber - 1 : 0; // archers start day 2
    let trollCount = dayNumber > 2 ? Math.floor(dayNumber / 2) : 0; // trolls start day 3

    // Spire floors remaining can also scale the budget (more floors = more enemies)
    // We'll keep it simple: multiply base by spireFloors/3, clamp to 1 minimum
    const multiplier = Math.max(1, spireFloors / 3);

    return {
        goblinCount: Math.ceil(goblinCount * multiplier),
        archerCount: Math.ceil(archerCount * multiplier),
        trollCount: Math.ceil(trollCount * multiplier)
    };
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createDayNightSystem(dayDurationMs = 45000, nightDurationMs = 30000) {
    return (world: IWorld, delta: number): IWorld => {
        const eids = dayNightQuery(world);
        if (eids.length === 0) return world;

        const eid = eids[0];
        let time = DayNightCycle.timeOfDay[eid];
        time += delta;
        DayNightCycle.timeOfDay[eid] = time;

        const phase = computeDayNightPhase(time, dayDurationMs, nightDurationMs);
        DayNightCycle.dayNumber[eid] = phase.dayNumber;
        DayNightCycle.isNight[eid] = phase.isNight ? 1 : 0;

        return world;
    };
}
