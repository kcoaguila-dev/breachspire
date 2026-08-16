const fs = require('fs');
let content = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');

// import createDayNightSystem and createDayNightEntity
content = content.replace(
    'import { createCampSiegeSystem, getWallDamageStage } from "../ecs/systems/CampSiegeSystem";',
    'import { createCampSiegeSystem, getWallDamageStage } from "../ecs/systems/CampSiegeSystem";\nimport { createDayNightSystem } from "../ecs/systems/DayNightSystem";'
);
content = content.replace(
    'import { createGameStateEntity, createInvasionSpawner, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, setPlayerControlled } from "../ecs/world";',
    'import { createGameStateEntity, createInvasionSpawner, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, setPlayerControlled, createDayNightEntity } from "../ecs/world";'
);

// declare dayNightSystem
if (!content.includes('private dayNightSystem')) {
    content = content.replace(
        'private monsterSpawnSystem!: ReturnType<typeof createMonsterSpawnSystem>;',
        'private monsterSpawnSystem!: ReturnType<typeof createMonsterSpawnSystem>;\n  private dayNightSystem!: ReturnType<typeof createDayNightSystem>;'
    );
}

// initialize dayNightSystem and createDayNightEntity
if (!content.includes('this.dayNightSystem = createDayNightSystem()')) {
    content = content.replace(
        'this.renderSyncSystem = createRenderSyncSystem(this, this.spriteMap);',
        'this.renderSyncSystem = createRenderSyncSystem(this, this.spriteMap);\n    this.dayNightSystem = createDayNightSystem(45000, 30000); // 45s day, 30s night'
    );
}

content = content.replace(
    'createGameStateEntity(world);',
    'createGameStateEntity(world);\n      createDayNightEntity(world);'
);

// Update monsterSpawnSystem instantiation in DemoScene
content = content.replace(
    'this.monsterSpawnSystem = createMonsterSpawnSystem(goblinData);',
    `let trollData = goblinData; // fallback
      try { trollData = await loadUnitData('/data/monsters/troll.json'); } catch(e) {}

      this.monsterSpawnSystem = createMonsterSpawnSystem(goblinData, p2Data, trollData); // Actually p2Data might be archer. Let's load archer explicitly for monsters if we can.`
);

// Let's refine the monsterSpawnSystem instantiation slightly to be safer
content = content.replace(
    /let trollData = goblinData;.*?this\.monsterSpawnSystem = createMonsterSpawnSystem\(goblinData, p2Data, trollData\);/s,
    `let trollData = goblinData;
      let archerData = goblinData;
      try { trollData = await loadUnitData('/data/monsters/troll.json'); } catch(e) {}
      try { archerData = await loadUnitData('/data/monsters/archer.json'); } catch(e) {}

      this.monsterSpawnSystem = createMonsterSpawnSystem(goblinData, archerData, trollData);`
);

// Run dayNightSystem in update
content = content.replace(
    'this.monsterSpawnSystem(world, delta);',
    'this.dayNightSystem(world, delta);\n    this.monsterSpawnSystem(world, delta);'
);

fs.writeFileSync('src/scenes/DemoScene.ts', content);
