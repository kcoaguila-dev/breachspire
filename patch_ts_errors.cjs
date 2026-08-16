const fs = require('fs');

// 1. DayNightSystem.ts unused imports
let dns = fs.readFileSync('src/ecs/systems/DayNightSystem.ts', 'utf8');
dns = dns.replace('import { defineQuery, IWorld, addEntity, addComponent } from "bitecs";', 'import { defineQuery, IWorld } from "bitecs";');
fs.writeFileSync('src/ecs/systems/DayNightSystem.ts', dns);

// 2. TextureGenerator.ts unused graphics
let tg = fs.readFileSync('src/gfx/TextureGenerator.ts', 'utf8');
tg = tg.replace(
    /private static generateSky\(scene: Phaser\.Scene, key: string, width: number, height: number\) \{\s*const graphics = scene\.make\.graphics\(\{ x: 0, y: 0 \}\);/,
    'private static generateSky(scene: Phaser.Scene, key: string, width: number, height: number) {'
);
fs.writeFileSync('src/gfx/TextureGenerator.ts', tg);

// 3. DemoScene.ts unused sh
let ds = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');
ds = ds.replace('const sh = this.scale.height;', '// const sh = this.scale.height;');
fs.writeFileSync('src/scenes/DemoScene.ts', ds);
