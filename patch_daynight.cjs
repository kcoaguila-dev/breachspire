const fs = require('fs');

const content = `import { defineQuery, IWorld, addEntity, addComponent } from "bitecs";
import { DayNightCycle } from "../components";

const dayNightQuery = defineQuery([DayNightCycle]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
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
`;

fs.writeFileSync('src/ecs/systems/DayNightSystem.ts', content);
