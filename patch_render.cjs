const fs = require('fs');

let content = fs.readFileSync('src/ecs/systems/RenderSyncSystem.ts', 'utf8');

// Update campCoreQuery
// The query is `const campCoreQuery = defineQuery([Position, CampCoreComponent]);`
// We need to query Health too since it has health now, but CampCoreComponent also has currentHP/maxHP which we can use, or we can use the Health component. Wait, the instructions say:
// "Ensure the Camp Hearth/Crystal has its own `Health` component (`maxHp: 1000`)."
// Let's add Health to campCoreQuery so we can read it.
content = content.replace(
    'const campCoreQuery = defineQuery([Position, CampCoreComponent]);',
    'const campCoreQuery = defineQuery([Position, CampCoreComponent, Health]);'
);

content = content.replace(
    'const campCoreQueryEnter = enterQuery(campCoreQuery);',
    'const campCoreQueryEnter = enterQuery(campCoreQuery);'
); // Just in case, this does not need replacement

content = content.replace(
    /const cores = campCoreQuery\(world\);\s*for \(let i = 0; i < cores.length; i\+\+\) {\s*const eid = cores\[i\];\s*const sprite = spriteMap.get\(eid\);\s*if \(sprite && sprite instanceof Phaser.GameObjects.Sprite\) {\s*sprite.setPosition\(Position.x\[eid\], Position.y\[eid\]\);\s*\/\/ Pulse animation based on time\s*const time = scene.time.now;\s*const scale = 1.0 \+ Math.sin\(time \/ 200\) \* 0.1;\s*sprite.setScale\(scale\);\s*}\s*}/,
    `const cores = campCoreQuery(world);
    for (let i = 0; i < cores.length; i++) {
      const eid = cores[i];
      const sprite = spriteMap.get(eid);
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], Position.y[eid]);
        const time = scene.time.now;

        // Diegetic Visuals based on Health
        const hpRatio = Math.max(0, Health.current[eid] / Health.max[eid]);

        if (hpRatio > 0.5) {
            // High HP: flickers intensely
            const scale = 1.0 + Math.sin(time / 150) * 0.15 * hpRatio;
            sprite.setScale(scale);
            sprite.setAlpha(1.0);
            sprite.clearTint();
        } else if (hpRatio > 0) {
            // Low HP: dims and cracks
            const scale = 0.9 + Math.sin(time / 300) * 0.05;
            sprite.setScale(scale);
            sprite.setAlpha(0.7 + 0.3 * hpRatio);
            sprite.setTint(0xffaaaa);
        } else {
            // Critical/Dead: darkens
            sprite.setScale(0.8);
            sprite.setAlpha(0.4);
            sprite.setTint(0x555555);
        }
      }
    }`
);

fs.writeFileSync('src/ecs/systems/RenderSyncSystem.ts', content);
