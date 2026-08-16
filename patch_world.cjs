const fs = require('fs');
let content = fs.readFileSync('src/ecs/world.ts', 'utf8');

if (!content.includes('DayNightCycle')) {
    content = content.replace(
        'import { GameStateComponent, GameStateValues, InvasionSpawner } from "./components";',
        'import { GameStateComponent, GameStateValues, InvasionSpawner, DayNightCycle } from "./components";'
    );
}

if (!content.includes('createDayNightEntity')) {
    content += `\nexport function createDayNightEntity(world: IWorld): number {
  const entity = addEntity(world);
  addComponent(world, DayNightCycle, entity);
  DayNightCycle.timeOfDay[entity] = 0;
  DayNightCycle.dayNumber[entity] = 1;
  DayNightCycle.isNight[entity] = 0;
  return entity;
}\n`;
    fs.writeFileSync('src/ecs/world.ts', content);
}
