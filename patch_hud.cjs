const fs = require('fs');

let content = fs.readFileSync('src/ecs/systems/HUDSystem.ts', 'utf8');

content = content.replace(
    'import { CampCoreComponent, SpireComponent, SpireSideValues } from "../components";',
    'import { CampCoreComponent, SpireComponent, SpireSideValues, DayNightCycle } from "../components";'
);

content = content.replace(
    'const spireQuery = defineQuery([SpireComponent]);',
    'const spireQuery = defineQuery([SpireComponent]);\nconst dayNightQuery = defineQuery([DayNightCycle]);'
);

content = content.replace(
    /const rightSpireText = scene.add.text\(780, 60, 'R Spire: 0 Floors', textStyle\).setOrigin\(1, 0\);\s*uiElements.push\(rightSpireText\);/,
    `const rightSpireText = scene.add.text(780, 60, 'R Spire: 0 Floors', textStyle).setOrigin(1, 0);
  uiElements.push(rightSpireText);

  // Day Night Text
  const dayNightText = scene.add.text(400, 50, 'Day 1 - Dawn', { fontSize: '18px', color: '#fff', backgroundColor: '#0008' }).setOrigin(0.5, 0);
  uiElements.push(dayNightText);`
);

content = content.replace(
    /return \(world: IWorld, _delta: number\): IWorld => {/,
    `return (world: IWorld, _delta: number): IWorld => {
    // 0. Update Day Night Cycle
    const cycleEids = dayNightQuery(world);
    if (cycleEids.length > 0) {
        const eid = cycleEids[0];
        const dayNum = DayNightCycle.dayNumber[eid];
        const isNight = DayNightCycle.isNight[eid] === 1;
        dayNightText.setText(\`Day \${dayNum} - \${isNight ? 'Nightfall' : 'Dawn'}\`);
    }`
);

fs.writeFileSync('src/ecs/systems/HUDSystem.ts', content);
