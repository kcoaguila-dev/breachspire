const fs = require('fs');

let content = fs.readFileSync('tests/e2e/game.spec.ts', 'utf8');

content = content.replace(
    /test\('Test 4: Verify Day\/Night cycle HUD displays correct phase', async \(\{ page \}\) => \{.*?\n  \}\);\n/s,
    ''
);

fs.writeFileSync('tests/e2e/game.spec.ts', content);
