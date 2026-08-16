const fs = require('fs');

let content = fs.readFileSync('src/gfx/TextureGenerator.ts', 'utf8');

// 1. bg_sky gradient update (y:0 to 650)
content = content.replace(
    'this.generatePixelBg(scene, "bg_sky", 800, 600, "#87CEEB", "#1E90FF");',
    `this.generateSky(scene, "bg_sky", 800, 1200);`
);

// Add generateSky
content = content.replace(
    'private static generatePixelBg(',
    `private static generateSky(scene: Phaser.Scene, key: string, width: number, height: number) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Sky from 0 to 650
        const gradientTexture = scene.textures.createCanvas(key, width, height);
        if (gradientTexture) {
            const context = gradientTexture.getContext();
            const grd = context.createLinearGradient(0, 0, 0, 650);
            grd.addColorStop(0, "#87CEEB");
            grd.addColorStop(1, "#1E90FF");
            context.fillStyle = grd;
            context.fillRect(0, 0, width, 650);
            // Black below 650 is fine or transparent, we'll draw subterranean later in DemoScene or here
            gradientTexture.refresh();
        }
    }

    private static generatePixelBg(`
);


// 2. Mountains - transparent underside
content = content.replace(
    `    private static generateMountains(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x607B8B, 1);
        graphics.beginPath();
        graphics.moveTo(0, 300);
        graphics.lineTo(200, 50);
        graphics.lineTo(400, 300);
        graphics.lineTo(600, 100);
        graphics.lineTo(800, 300);
        graphics.fillPath();
        graphics.generateTexture(key, 800, 300);
        graphics.destroy();
    }`,
    `    private static generateMountains(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x607B8B, 1);
        graphics.beginPath();
        graphics.moveTo(0, 300);
        graphics.lineTo(200, 50);
        graphics.lineTo(400, 300);
        graphics.lineTo(600, 100);
        graphics.lineTo(800, 300);
        graphics.fillPath();
        graphics.generateTexture(key, 800, 300);
        graphics.destroy();
    }`
); // Oh wait, mountains are already filled paths with Y down to 300, which means they take up top part and nothing below 300. This is good.

// 3. Trees - modify bg_trees generator to generateTrees instead of pixel bg
content = content.replace(
    'this.generatePixelBg(scene, "bg_trees", 800, 200, "#228B22", "#006400");',
    'this.generateTrees(scene, "bg_trees");'
);

content = content.replace(
    'private static generateRect(',
    `private static generateTrees(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = 0x228B22;
        const c2 = 0x006400;

        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 800;
            const height = 100 + Math.random() * 100;
            const y = 200; // bottom

            graphics.fillStyle((Math.random() > 0.5) ? c1 : c2, 1);
            graphics.beginPath();
            graphics.moveTo(x - 20, y);
            graphics.lineTo(x, y - height);
            graphics.lineTo(x + 20, y);
            graphics.fillPath();
        }
        graphics.generateTexture(key, 800, 200);
        graphics.destroy();
    }

    private static generateRect(`
);


fs.writeFileSync('src/gfx/TextureGenerator.ts', content);
