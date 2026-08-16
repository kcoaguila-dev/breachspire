const fs = require('fs');
let content = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');

content = content.replace(
    /import { createGameStateEntity, createInvasionSpawner, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, setPlayerControlled } from "\.\.\/ecs\/world";/,
    'import { createGameStateEntity, createInvasionSpawner, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, setPlayerControlled, createDayNightEntity } from "../ecs/world";'
);

fs.writeFileSync('src/scenes/DemoScene.ts', content);
