const fs = require('fs');
let content = fs.readFileSync('src/ecs/components/index.ts', 'utf8');

if (!content.includes('DayNightCycle')) {
    content += `\n// ─────────────────────────────────────────────────────\n// Phase 8 Components\n// ─────────────────────────────────────────────────────\n\nexport const DayNightCycle = defineComponent({\n  timeOfDay: Types.f32,\n  dayNumber: Types.ui16,\n  isNight: Types.ui8,\n});\n`;
    fs.writeFileSync('src/ecs/components/index.ts', content);
}
