const fs = require('fs');
let content = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');

content = content.replace(
    /import { world, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, createGameStateEntity, createInvasionSpawner, setPlayerControlled } from "\.\.\/ecs\/world";/,
    'import { world, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, createGameStateEntity, createInvasionSpawner, setPlayerControlled, createDayNightEntity } from "../ecs/world";'
);

fs.writeFileSync('src/scenes/DemoScene.ts', content);
