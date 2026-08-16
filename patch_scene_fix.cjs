const fs = require('fs');
let content = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');

content = content.replace(
    /this\.bgTrees = this\.add\.tileSprite\(sw \/ 2, sh - 140, sw, 200, "bg_trees"\)\.setScrollFactor\(0\)\.setDepth\(-8\);\s*this\.add\.tileSprite\(worldWidth \/ 2, centerY \+ 32, worldWidth, 64, "ground_tile"\)\.setScrollFactor\(1\.0\)\.setDepth\(0\);/,
    `this.bgTrees = this.add.tileSprite(sw / 2, centerY - 40, sw, 200, "bg_trees").setScrollFactor(0).setDepth(-8);
      this.add.tileSprite(worldWidth / 2, centerY + 32, worldWidth, 64, "ground_tile").setScrollFactor(1.0).setDepth(0);
      this.add.rectangle(worldWidth / 2, 650 + 64 + (1200 - (650 + 64)) / 2, worldWidth, 1200 - (650 + 64), 0x332211).setScrollFactor(1.0).setDepth(0);`
);

fs.writeFileSync('src/scenes/DemoScene.ts', content);
