const fs = require('fs');

let content = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');
content = `import { createDayNightSystem } from "../ecs/systems/DayNightSystem";\n` + content;
fs.writeFileSync('src/scenes/DemoScene.ts', content);
