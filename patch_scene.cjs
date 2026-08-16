const fs = require('fs');

let content = fs.readFileSync('src/scenes/DemoScene.ts', 'utf8');

content = content.replace(
    'this.add.tileSprite(sw / 2, sh / 2, sw, sh, "bg_sky").setScrollFactor(0).setDepth(-10);',
    'this.add.tileSprite(sw / 2, 600, sw, 1200, "bg_sky").setScrollFactor(0).setDepth(-10);'
);

content = content.replace(
    'this.bgMountains = this.add.tileSprite(sw / 2, sh - 220, sw, 300, "bg_mountains").setScrollFactor(0).setDepth(-9);',
    'this.bgMountains = this.add.tileSprite(sw / 2, centerY - 150, sw, 300, "bg_mountains").setScrollFactor(0).setDepth(-9);'
); // center of mountains is height / 2 = 150. If we want it at centerY - 100 anchor... actually Y center is height/2 for tilesprite.
// So if centerY = 650, and mountains height is 300, top is 650 - 300 = 350. Wait, DemoScene instructions say:
// "anchor mountain tiles at centerY - 100 and tree tiles at centerY - 40"

content = content.replace(
    'this.bgMountains = this.add.tileSprite(sw / 2, centerY - 150, sw, 300, "bg_mountains").setScrollFactor(0).setDepth(-9);', // in case already replaced
    'this.bgMountains = this.add.tileSprite(sw / 2, centerY - 100, sw, 300, "bg_mountains").setScrollFactor(0).setDepth(-9);'
);

// Actually let's just do a clean replace using regex for the parallax section
content = content.replace(
    /this\.add\.tileSprite\(sw \/ 2, sh \/ 2, sw, sh, "bg_sky"\)\.setScrollFactor\(0\)\.setDepth\(-10\);\s*this\.bgMountains = this\.add\.tileSprite\(sw \/ 2, sh - 220, sw, 300, "bg_mountains"\)\.setScrollFactor\(0\)\.setDepth\(-9\);\s*this\.bgTrees = this\.add\.tileSprite\(sw \/ 2, sh - 140, sw, 200, "bg_trees"\)\.setScrollFactor\(0\)\.setDepth\(-8\);\s*this\.add\.tileSprite\(worldWidth \/ 2, centerY \+ 32, worldWidth, 64, "ground_tile"\)\.setScrollFactor\(1\.0\)\.setDepth\(0\);/,
    `this.add.tileSprite(sw / 2, 600, sw, 1200, "bg_sky").setScrollFactor(0).setDepth(-10);
      this.bgMountains = this.add.tileSprite(sw / 2, centerY - 100, sw, 300, "bg_mountains").setScrollFactor(0).setDepth(-9);
      this.bgTrees = this.add.tileSprite(sw / 2, centerY - 40, sw, 200, "bg_trees").setScrollFactor(0).setDepth(-8);

      // The walking plane is at Y: 650. Subterranean earth fills solidly from Y: 650 down to Y: 1200.
      this.add.tileSprite(worldWidth / 2, centerY + 32, worldWidth, 64, "ground_tile").setScrollFactor(1.0).setDepth(0);
      // Solid underground fill below Y: 650
      this.add.rectangle(worldWidth / 2, 650 + 64 + (1200 - (650 + 64)) / 2, worldWidth, 1200 - (650 + 64), 0x332211).setScrollFactor(1.0).setDepth(0);`
);

fs.writeFileSync('src/scenes/DemoScene.ts', content);
