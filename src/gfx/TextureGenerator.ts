import Phaser from "phaser";
import { FactionValues, CombatTypeValues } from "../ecs/components";

export function getUnitTextureKey(faction: number, combatType: number, isFlying: boolean, role?: number): string {
    if (faction === FactionValues.Hero) {
        if (role === 0) return "peasant_unit"; // Peasant
        if (role === 1) return "peasant_unit"; // Builder
        if (isFlying)                               return "anim_valkyrie";
        if (combatType === CombatTypeValues.Melee)  return "anim_commander";
        if (combatType === CombatTypeValues.Ranged) return "anim_archer";
        if (combatType === CombatTypeValues.Magic)  return "anim_mage";
        return "anim_commander"; // fallback
    } else {
        if (combatType === CombatTypeValues.Melee)  return "anim_troll";
        if (combatType === CombatTypeValues.Ranged) return "anim_goblin";
        if (combatType === CombatTypeValues.Magic)  return "anim_cultist";
        return "anim_goblin";
    }
}

// Unit texture keys loaded from real sprite sheets by BootScene
const SPRITE_SHEET_KEYS = new Set([
    "anim_commander", "anim_knight", "anim_archer", "anim_mage", "anim_valkyrie",
    "anim_goblin", "anim_troll", "anim_cultist",
    "unit_knight", "unit_archer", "unit_mage", "unit_valkyrie",
    "steed_commander", "unit_goblin", "unit_troll", "unit_cultist",
    "camp_core_hearth", "light_aether_crystal",
]);

export class TextureGenerator {
    static generateAll(scene: Phaser.Scene) {
        // Environment Parallax
        this.generateSky(scene, "bg_sky", 800, 1200);
        this.generateMountains(scene, "bg_mountains");
        this.generateTrees(scene, "bg_trees");
        this.generatePixelBg(scene, "ground_tile", 64, 64, "#8B4513", "#5C4033");
        this.generateCobblestoneBank(scene, "ground_cobblestone_bank");

        // Camp — only generate hearth programmatically if real crystal wasn't loaded
        this.generateCampCore(scene, "camp_core_hearth");
        this.generateRect(scene, "camp_wall_wood", 32, 128, "#8B4513");
        this.generateWallFoundationMound(scene, "wall_foundation_mound");
        this.generateWallStonePristine(scene, "wall_stage_1_pristine");
        this.generateWallStoneCracked(scene, "wall_stage_2_cracked");
        this.generateWallStoneCrumbling(scene, "wall_stage_3_crumbling");
        this.generateWallStoneCritical(scene, "wall_stage_4_critical");
        this.generateWallRubbleCollapsed(scene, "wall_rubble_collapsed");
        this.generateRect(scene, "camp_wall_stone", 32, 128, "#708090"); // Keep for fallback if needed

        // Spires
        this.generateCutawayWall(scene, "spire_cutaway_wall");
        this.generateArchwayWall(scene, "spire_archway_wall");
        this.generatePixelBg(scene, "spire_floor_platform", 128, 16, "#8B4513", "#654321");
        this.generateRect(scene, "spire_barricade_gate", 32, 64, "#4B0082");
        this.generateDarkCrystal(scene, "spire_dark_crystal");

        // Recruitment & Tool Stands
        this.generateToolHammerStand(scene, "tool_hammer_stand");
        this.generateToolBowStand(scene, "tool_bow_stand");
        this.generateToolSwordStand(scene, "tool_sword_stand");

        // Peasant (no real sprite sheet for this one yet)
        this.generatePeasantUnit(scene, "peasant_unit");

        // Units — skip if already loaded from sprite sheet by BootScene
        this.generateKnight(scene, "unit_knight");
        this.generateArcher(scene, "unit_archer");
        this.generateMage(scene, "unit_mage");
        this.generateValkyrie(scene, "unit_valkyrie");
        this.generateGoblin(scene, "unit_goblin");
        this.generateTroll(scene, "unit_troll");
        this.generateCultist(scene, "unit_cultist");
        this.generateSteedCommander(scene, "steed_commander");
    }

    // Returns true if the key should use a real sprite sheet instead of the programmatic fallback
    static isRealSprite(scene: Phaser.Scene, key: string): boolean {
        return SPRITE_SHEET_KEYS.has(key) && scene.textures.exists(key);
    }

    private static generateWallFoundationMound(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x654321, 1);
        graphics.beginPath();
        graphics.moveTo(0, 128);
        graphics.lineTo(16, 110);
        graphics.lineTo(32, 128);
        graphics.fillPath();

        graphics.fillStyle(0xa0a0a0, 1);
        graphics.fillRect(14, 96, 4, 16);

        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateSteedCommander(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Steed Body
        graphics.fillStyle(0xC0C0C0, 1); // Armored barding
        graphics.fillRect(4, 16, 24, 12);
        // Steed Legs
        graphics.fillStyle(0x808080, 1);
        graphics.fillRect(6, 28, 4, 4);
        graphics.fillRect(22, 28, 4, 4);
        // Steed Head
        graphics.fillStyle(0xC0C0C0, 1);
        graphics.fillRect(24, 8, 8, 8);

        // Commander Body
        graphics.fillStyle(0x00FFFF, 1); // Cyan cloak
        graphics.fillRect(10, 8, 10, 10);
        // Commander Head
        graphics.fillStyle(0xFFCCB6, 1); // Face
        graphics.fillRect(12, 2, 6, 6);
        // Monarch Crown
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillRect(12, 0, 6, 2);
        graphics.fillRect(12, -2, 2, 2);
        graphics.fillRect(16, -2, 2, 2);

        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateToolHammerStand(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Wooden workbench
        graphics.fillStyle(0x5c3a21, 1);
        graphics.fillRect(4, 18, 24, 12);
        // Anvil
        graphics.fillStyle(0x3a4048, 1);
        graphics.fillRect(8, 12, 16, 6);
        graphics.fillRect(10, 8, 12, 4);
        // Hammer
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(18, 4, 3, 10);
        graphics.fillStyle(0xb0c4de, 1);
        graphics.fillRect(15, 2, 9, 4);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateToolBowStand(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Wooden rack
        graphics.fillStyle(0x5c3a21, 1);
        graphics.fillRect(6, 14, 20, 16);
        // Archery target board
        graphics.fillStyle(0xf0ece1, 1);
        graphics.fillCircle(16, 10, 8);
        graphics.fillStyle(0xcc2222, 1);
        graphics.fillCircle(16, 10, 5);
        graphics.fillStyle(0xffea00, 1);
        graphics.fillCircle(16, 10, 2);
        // Bow leaning
        graphics.lineStyle(2, 0x8b5a2b, 1);
        graphics.beginPath();
        graphics.moveTo(24, 6);
        graphics.lineTo(28, 22);
        graphics.strokePath();
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateToolSwordStand(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Wooden weapon rack
        graphics.fillStyle(0x5c3a21, 1);
        graphics.fillRect(6, 14, 20, 16);
        // Shield
        graphics.fillStyle(0x335588, 1);
        graphics.fillCircle(12, 16, 6);
        graphics.fillStyle(0xffea00, 1);
        graphics.fillRect(11, 12, 2, 8);
        // Sword
        graphics.fillStyle(0xddeeff, 1);
        graphics.fillRect(20, 2, 3, 18);
        graphics.fillStyle(0xffea00, 1);
        graphics.fillRect(17, 18, 9, 2);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generatePeasantUnit(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Head / Skin
        graphics.fillStyle(0xf5cda0, 1);
        graphics.fillRect(12, 6, 8, 8);
        // Cap
        graphics.fillStyle(0x4a3728, 1);
        graphics.fillRect(11, 4, 10, 4);
        // Eyes
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(17, 9, 2, 2);
        // Tunic (peasant brown/green)
        graphics.fillStyle(0x5c7a42, 1);
        graphics.fillRect(10, 14, 12, 10);
        // Belt
        graphics.fillStyle(0x332211, 1);
        graphics.fillRect(10, 19, 12, 2);
        // Legs / Boots
        graphics.fillStyle(0x3b2b1d, 1);
        graphics.fillRect(11, 24, 4, 6);
        graphics.fillRect(17, 24, 4, 6);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateWallStonePristine(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(0, 0, 32, 128);
        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateWallStoneCracked(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(0, 0, 32, 128);
        // Cracks
        graphics.lineStyle(2, 0x2f4f4f, 1);
        graphics.beginPath();
        graphics.moveTo(8, 0);
        graphics.lineTo(16, 32);
        graphics.lineTo(8, 64);
        graphics.strokePath();
        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateWallStoneCrumbling(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(0, 0, 32, 128);
        // Deep Cracks
        graphics.lineStyle(3, 0x2f4f4f, 1);
        graphics.beginPath();
        graphics.moveTo(16, 0);
        graphics.lineTo(8, 32);
        graphics.lineTo(24, 64);
        graphics.lineTo(16, 96);
        graphics.strokePath();
        // Chips
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 32, 8, 8);
        graphics.fillRect(24, 80, 8, 16);
        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateWallStoneCritical(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(0, 32, 32, 96); // Top missing
        // Heavy fractures
        graphics.lineStyle(4, 0x1a2421, 1);
        graphics.beginPath();
        graphics.moveTo(0, 32);
        graphics.lineTo(16, 64);
        graphics.lineTo(8, 96);
        graphics.lineTo(32, 128);
        graphics.strokePath();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 64, 12, 12);
        graphics.fillRect(20, 96, 12, 16);
        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateWallRubbleCollapsed(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Only rubble at bottom
        graphics.fillStyle(0x404040, 1);
        graphics.beginPath();
        graphics.moveTo(0, 128);
        graphics.lineTo(8, 100);
        graphics.lineTo(24, 110);
        graphics.lineTo(32, 128);
        graphics.fillPath();
        // Loose stones
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(4, 115, 8, 8);
        graphics.fillRect(20, 120, 6, 6);
        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateCobblestoneBank(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = Phaser.Display.Color.HexStringToColor("#696969").color; // Dim gray
        const c2 = Phaser.Display.Color.HexStringToColor("#808080").color; // Gray
        const c3 = Phaser.Display.Color.HexStringToColor("#A9A9A9").color; // Dark gray

        for (let y = 0; y < 64; y += 16) {
            for (let x = 0; x < 64; x += 16) {
                const r = Math.random();
                graphics.fillStyle(r < 0.33 ? c1 : (r < 0.66 ? c2 : c3), 1);
                // Draw rounded cobblestones
                graphics.fillRoundedRect(x + 2, y + 2, 12, 12, 4);
            }
        }
        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    private static generateTrees(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = 0x228B22;
        const c2 = 0x006400;

        for (let i = 0; i < 40; i++) {
            const x = Math.random() * 800;
            const height = 120 + Math.random() * 80;
            const y = 200; // bottom

            // Layered pine trees
            graphics.fillStyle((Math.random() > 0.5) ? c1 : c2, 1);
            graphics.beginPath();
            graphics.moveTo(x - 15, y);
            graphics.lineTo(x, y - height);
            graphics.lineTo(x + 15, y);
            graphics.fillPath();

            // Second layer of branches
            graphics.beginPath();
            graphics.moveTo(x - 20, y);
            graphics.lineTo(x, y - height * 0.6);
            graphics.lineTo(x + 20, y);
            graphics.fillPath();
        }
        graphics.generateTexture(key, 800, 200);
        graphics.destroy();
    }

    private static generateRect(scene: Phaser.Scene, key: string, width: number, height: number, colorStr: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colorStr).color, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    private static generateSky(scene: Phaser.Scene, key: string, width: number, height: number) {
        if (scene.textures.exists(key)) return;
        // Sky from 0 to 650 (Dusk/Sunset)
        const gradientTexture = scene.textures.createCanvas(key, width, height);
        if (gradientTexture) {
            const context = gradientTexture.getContext();
            const grd = context.createLinearGradient(0, 0, 0, 650);
            grd.addColorStop(0, "#8A2BE2"); // Deep Purple
            grd.addColorStop(0.5, "#CD5C5C"); // Indian Red
            grd.addColorStop(1, "#FF7F50"); // Coral
            context.fillStyle = grd;
            context.fillRect(0, 0, width, 650);
            gradientTexture.refresh();
        }
    }

    private static generatePixelBg(scene: Phaser.Scene, key: string, width: number, height: number, color1: string, color2: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = Phaser.Display.Color.HexStringToColor(color1).color;
        const c2 = Phaser.Display.Color.HexStringToColor(color2).color;
        for (let y = 0; y < height; y += 16) {
            for (let x = 0; x < width; x += 16) {
                graphics.fillStyle((Math.random() > 0.5) ? c1 : c2, 1);
                graphics.fillRect(x, y, 16, 16);
            }
        }
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    private static generateMountains(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x2F4F4F, 1); // Dark slate gray titan silhouettes
        graphics.beginPath();
        graphics.moveTo(0, 300);
        graphics.lineTo(150, 100);
        graphics.lineTo(250, 150);
        graphics.lineTo(400, 50);
        graphics.lineTo(550, 200);
        graphics.lineTo(700, 80);
        graphics.lineTo(800, 300);
        graphics.fillPath();
        graphics.generateTexture(key, 800, 300);
        graphics.destroy();
    }

    private static generateCampCore(scene: Phaser.Scene, key: string) {
        // If real crystal sprite was loaded by BootScene, use that instead
        if (scene.textures.exists(key)) return;
        if (scene.textures.exists("light_aether_crystal")) {
            // Alias: use the crystal image as the camp core texture
            const crystalImg = scene.textures.get("light_aether_crystal");
            scene.textures.addImage(key, crystalImg.getSourceImage() as HTMLImageElement);
            return;
        }
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Nordic Longhouse (Great Hall)
        graphics.fillStyle(0x8B4513, 1); // Wooden walls
        graphics.fillRect(8, 24, 48, 40);

        // Golden straw-thatched roof
        graphics.fillStyle(0xDAA520, 1);
        graphics.beginPath();
        graphics.moveTo(0, 24);
        graphics.lineTo(32, 0);
        graphics.lineTo(64, 24);
        graphics.fillPath();

        // Timber cross-gables
        graphics.lineStyle(2, 0x5C4033, 1);
        graphics.beginPath();
        graphics.moveTo(24, 8);
        graphics.lineTo(40, 24);
        graphics.moveTo(40, 8);
        graphics.lineTo(24, 24);
        graphics.strokePath();

        // Hanging purple heraldry banner
        graphics.fillStyle(0x800080, 1);
        graphics.fillRect(28, 24, 8, 16);

        // Stone hearth brazier emitting amber light
        graphics.fillStyle(0x808080, 1);
        graphics.fillRect(40, 48, 12, 16);
        graphics.fillStyle(0xFFBF00, 1); // Amber glow
        graphics.fillCircle(46, 44, 6);
        graphics.fillStyle(0xFF4500, 1); // Orange-red core
        graphics.fillCircle(46, 44, 3);

        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    private static generateCutawayWall(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = 0x2f3542;
        const c2 = 0x1e272e;
        // The cutaway interior with dark stone bricks and wooden cross-beams.
        for (let y = 0; y < 120; y += 16) {
            for (let x = 0; x < 128; x += 32) {
                const offset = (y % 32 === 0) ? 0 : 16;
                graphics.fillStyle(c1, 1);
                graphics.fillRect(x + offset, y, 30, 14);
                graphics.fillStyle(c2, 1);
                graphics.fillRect(x + offset + 30, y, 2, 16);
                graphics.fillRect(x + offset, y + 14, 32, 2);
            }
        }

        // Wooden cross-beams
        graphics.fillStyle(0x4a2e15, 1); // Dark wood color
        graphics.fillRect(0, 0, 128, 8); // Top horizontal beam
        graphics.fillRect(0, 112, 128, 8); // Bottom horizontal beam
        // Vertical beams on sides
        graphics.fillRect(0, 0, 8, 120);
        graphics.fillRect(120, 0, 8, 120);

        graphics.generateTexture(key, 128, 120);
        graphics.destroy();
    }

    private static generateArchwayWall(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = 0x576574; // Lighter stone for exterior
        const c2 = 0x2f3542;
        for (let y = 0; y < 120; y += 16) {
            for (let x = 0; x < 128; x += 32) {
                const offset = (y % 32 === 0) ? 0 : 16;
                graphics.fillStyle(c1, 1);
                graphics.fillRect(x + offset, y, 30, 14);
                graphics.fillStyle(c2, 1);
                graphics.fillRect(x + offset + 30, y, 2, 16);
                graphics.fillRect(x + offset, y + 14, 32, 2);
            }
        }

        // Grounded outer stone fortress wall with arched gateway entrance
        graphics.fillStyle(0x0d0f18, 1); // Dark entrance
        // Draw an arch
        graphics.fillCircle(64, 50, 40);
        graphics.fillRect(24, 50, 80, 70);

        graphics.generateTexture(key, 128, 120);
        graphics.destroy();
    }

    private static generateDarkCrystal(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x6c5ce7, 1);
        graphics.beginPath();
        graphics.moveTo(16, 16);
        graphics.lineTo(32, 0);
        graphics.lineTo(48, 16);
        graphics.lineTo(32, 48);
        graphics.fillPath();
        graphics.fillStyle(0xfd79a8, 1);
        graphics.fillCircle(32, 24, 6);
        graphics.fillStyle(0xa29bfe, 1);
        graphics.fillCircle(32, 24, 3);
        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    private static generateKnight(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Helmet
        graphics.fillStyle(0x7b8594, 1);
        graphics.fillRect(6, 4, 12, 8);
        // Visor slit
        graphics.fillStyle(0x1a1a24, 1);
        graphics.fillRect(14, 6, 4, 2);
        // Red Plume
        graphics.fillStyle(0xc0392b, 1);
        graphics.fillRect(10, 0, 4, 4);
        // Body
        graphics.fillStyle(0x95a5a6, 1);
        graphics.fillRect(6, 12, 12, 8);
        // Tabard
        graphics.fillStyle(0x2980b9, 1);
        graphics.fillRect(8, 12, 8, 8);
        // Shield
        graphics.fillStyle(0xf1c40f, 1);
        graphics.fillRect(16, 12, 6, 8);
        // Sword
        graphics.fillStyle(0xecf0f1, 1);
        graphics.fillRect(20, 8, 2, 10);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }

    private static generateArcher(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Hood
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillRect(6, 4, 12, 8);
        // Face Shadow
        graphics.fillStyle(0x1e372e, 1);
        graphics.fillRect(12, 6, 6, 4);
        // Body
        graphics.fillStyle(0x795548, 1);
        graphics.fillRect(8, 12, 8, 8);
        // Bow
        graphics.fillStyle(0xd35400, 1);
        graphics.fillRect(18, 6, 2, 14);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }

    private static generateMage(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Cowl
        graphics.fillStyle(0x8e44ad, 1);
        graphics.fillRect(6, 4, 12, 16);
        // Gold hem
        graphics.fillStyle(0xf39c12, 1);
        graphics.fillRect(6, 18, 12, 2);
        // Face Shadow
        graphics.fillStyle(0x1e372e, 1);
        graphics.fillRect(14, 6, 4, 4);
        // Staff
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(18, 4, 2, 16);
        // Orb
        graphics.fillStyle(0x00d2d3, 1);
        graphics.fillCircle(19, 2, 3);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }

    private static generateValkyrie(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Helm
        graphics.fillStyle(0xbdc3c7, 1);
        graphics.fillRect(6, 4, 10, 8);
        // Wings
        graphics.fillStyle(0x74b9ff, 1);
        graphics.beginPath();
        graphics.moveTo(6, 8);
        graphics.lineTo(0, 0);
        graphics.lineTo(0, 12);
        graphics.fillPath();
        // Body
        graphics.fillStyle(0xf1c40f, 1);
        graphics.fillRect(8, 12, 8, 8);
        // Spear
        graphics.fillStyle(0xecf0f1, 1);
        graphics.fillRect(18, 0, 2, 24);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }

    private static generateTroll(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Massive Body
        graphics.fillStyle(0x576574, 1);
        graphics.fillRect(4, 8, 24, 20);
        // Horns
        graphics.fillStyle(0x2f3542, 1);
        graphics.fillRect(6, 2, 4, 6);
        graphics.fillRect(22, 2, 4, 6);
        // Club
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(28, 4, 4, 24);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateGoblin(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Body
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillRect(6, 8, 12, 12);
        // Ears
        graphics.fillStyle(0x2ecc71, 1);
        graphics.fillRect(0, 8, 6, 2);
        graphics.fillRect(18, 8, 6, 2);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }

    private static generateCultist(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Robe
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillRect(6, 4, 12, 16);
        // Face Shadow
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(10, 6, 6, 4);
        // Red emblem
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillCircle(12, 14, 2);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }
}
