const fs = require('fs');

let content = fs.readFileSync('src/ecs/systems/MonsterSpawnSystem.ts', 'utf8');

// Need to update monsterSpawnSystem to read DayNightCycle
content = content.replace(
    'import { InvasionSpawner, SpireComponent, Position } from "../components";',
    'import { InvasionSpawner, SpireComponent, Position, DayNightCycle } from "../components";'
);
content = content.replace(
    'import { createUnitEntity } from "../world";',
    'import { createUnitEntity } from "../world";\nimport { computeWaveComposition } from "./DayNightSystem";'
);

// add dayNightQuery
if (!content.includes('const dayNightQuery =')) {
    content = content.replace(
        'const spawnerQuery = defineQuery([InvasionSpawner, SpireComponent, Position]);',
        'const spawnerQuery = defineQuery([InvasionSpawner, SpireComponent, Position]);\nconst dayNightQuery = defineQuery([DayNightCycle]);'
    );
}

// Update the system parameters and logic
content = content.replace(
    /export function createMonsterSpawnSystem\(monsterData: UnitStats\) {/,
    `export function createMonsterSpawnSystem(monsterData: UnitStats, archerData?: UnitStats, trollData?: UnitStats) {`
);

content = content.replace(
    /return \(world: IWorld, delta: number\): IWorld => {/,
    `return (world: IWorld, delta: number): IWorld => {
    const timeEids = dayNightQuery(world);
    const isNight = timeEids.length > 0 ? DayNightCycle.isNight[timeEids[0]] === 1 : true;
    const dayNumber = timeEids.length > 0 ? DayNightCycle.dayNumber[timeEids[0]] : 1;

    // Only spawn during night
    if (!isNight) return world;`
);

content = content.replace(
    /const waveSize = InvasionSpawner\.waveSize\[eid\];.*?(?=\s*InvasionSpawner\.timer\[eid\] = timer;)/s,
    `const spireFloors = SpireComponent.floorCount[eid];
        const composition = computeWaveComposition(dayNumber, spireFloors);

        const baseX = Position.x[eid];
        const baseY = Position.y[eid];

        let spawnOffset = 0;
        const dir = SpireComponent.side[eid] === 0 ? 1 : -1;

        // Goblins
        for (let j = 0; j < composition.goblinCount; j++) {
           const spawnX = baseX + (spawnOffset * 10) * dir;
           createUnitEntity(world, monsterData, spawnX, baseY);
           spawnOffset++;
        }

        // Archers
        if (archerData) {
            for (let j = 0; j < composition.archerCount; j++) {
               const spawnX = baseX + (spawnOffset * 10) * dir;
               createUnitEntity(world, archerData, spawnX, baseY);
               spawnOffset++;
            }
        }

        // Trolls
        if (trollData) {
            for (let j = 0; j < composition.trollCount; j++) {
               const spawnX = baseX + (spawnOffset * 10) * dir;
               createUnitEntity(world, trollData, spawnX, baseY);
               spawnOffset++;
            }
        }
      }`
);

fs.writeFileSync('src/ecs/systems/MonsterSpawnSystem.ts', content);
