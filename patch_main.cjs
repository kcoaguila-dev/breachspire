const fs = require('fs');
let content = fs.readFileSync('src/main.ts', 'utf8');

content = content.replace(
    'mode: Phaser.Scale.FIT,',
    'mode: Phaser.Scale.RESIZE,'
);

fs.writeFileSync('src/main.ts', content);
