import Phaser from "phaser";
import { FactionValues, CombatTypeValues } from "../ecs/components";

export function getUnitTextureKey(faction: number, combatType: number, isFlying: boolean, role?: number): string {
    if (faction === FactionValues.Hero) {
        if (role === 0) return "peasant_unit"; // Peasant
        if (role === 1) return "builder_unit"; // Builder
        if (isFlying)                               return "anim_valkyrie";
        if (combatType === CombatTypeValues.Melee)  return "anim_knight";
        if (combatType === CombatTypeValues.Ranged) return "anim_archer";
        if (combatType === CombatTypeValues.Magic)  return "anim_mage";
        return "anim_knight"; // fallback
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

        // Peasant & Builder (generated pixel art)
        this.generatePeasantUnit(scene, "peasant_unit");
        this.generateBuilderUnit(scene, "builder_unit");

        // Units — skip if already loaded from sprite sheet by BootScene
        this.generateKnight(scene, "unit_knight");
        this.generateArcher(scene, "unit_archer");
        this.generateMage(scene, "unit_mage");
        this.generateValkyrie(scene, "unit_valkyrie");
        this.generateGoblin(scene, "unit_goblin");
        this.generateTroll(scene, "unit_troll");
        this.generateCultist(scene, "unit_cultist");
        this.generateSteedCommander(scene, "steed_commander");

        // Harvestable nodes
        this.generatePineTree(scene, "node_pine_tree");
        this.generateIronOre(scene, "node_iron_ore");

        // Tiered Walls & Structures
        this.generateWoodPalisade(scene, "wall_wood_palisade");
        this.generateIronSpikedWall(scene, "wall_iron_spikes");
        this.generateWatchtower(scene, "watchtower_structure");
    }

    private static generatePineTree(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // Trunk (48x96)
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(20, 56, 8, 40);
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(22, 56, 4, 40);

        // Layered Pine Foliage (Bottom to Top)
        const layers = [
            { y: 52, w: 44, h: 22, color: 0x1b5e20 },
            { y: 36, w: 36, h: 20, color: 0x2e7d32 },
            { y: 22, w: 28, h: 18, color: 0x388e3c },
            { y: 6,  w: 18, h: 18, color: 0x43a047 },
        ];

        for (const l of layers) {
            graphics.fillStyle(l.color, 1);
            graphics.beginPath();
            graphics.moveTo(24 - l.w / 2, l.y + l.h);
            graphics.lineTo(24, l.y);
            graphics.lineTo(24 + l.w / 2, l.y + l.h);
            graphics.closePath();
            graphics.fillPath();

            // Foliage highlight
            graphics.fillStyle(0x81c784, 0.6);
            graphics.fillRect(24 - l.w / 4, l.y + 6, l.w / 2, 2);
        }

        graphics.generateTexture(key, 48, 96);
        graphics.destroy();
    }

    private static generateIronOre(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // Dark Granite Rock Base (40x32)
        graphics.fillStyle(0x263238, 1);
        graphics.beginPath();
        graphics.moveTo(0, 32);
        graphics.lineTo(6, 12);
        graphics.lineTo(20, 4);
        graphics.lineTo(34, 10);
        graphics.lineTo(40, 32);
        graphics.closePath();
        graphics.fillPath();

        // Mid-tone Stone Facets
        graphics.fillStyle(0x455a64, 1);
        graphics.fillRect(8, 14, 24, 14);
        graphics.fillStyle(0x607d8b, 1);
        graphics.fillRect(12, 8, 16, 10);

        // Metallic Silver / Iron Ore Veins
        graphics.fillStyle(0xcfd8dc, 1);
        graphics.fillRect(10, 16, 6, 4);
        graphics.fillRect(22, 12, 8, 5);
        graphics.fillRect(16, 22, 10, 4);

        // Metallic Sparkle / Gleam Highlights
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(12, 17, 2, 2);
        graphics.fillRect(25, 13, 2, 2);
        graphics.fillRect(18, 23, 2, 2);

        graphics.generateTexture(key, 40, 32);
        graphics.destroy();
    }

    private static generateWoodPalisade(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // Vertical Log Stakes (48x64)
        for (let x = 0; x < 48; x += 8) {
            graphics.fillStyle(0x3e2723, 1);
            graphics.fillRect(x, 8, 8, 56);
            graphics.fillStyle(0x5d4037, 1);
            graphics.fillRect(x + 1, 9, 6, 54);
            graphics.fillStyle(0x8d6e63, 1);
            graphics.fillRect(x + 2, 10, 2, 50);

            // Sharpened Log Tips
            graphics.fillStyle(0x5d4037, 1);
            graphics.beginPath();
            graphics.moveTo(x, 8);
            graphics.lineTo(x + 4, 0);
            graphics.lineTo(x + 8, 8);
            graphics.closePath();
            graphics.fillPath();
        }

        // Horizontal Oak Cross-Beams & Rope Bindings
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(0, 20, 48, 6);
        graphics.fillRect(0, 44, 48, 6);
        graphics.fillStyle(0xd7ccc8, 1);
        graphics.fillRect(8, 20, 4, 6);
        graphics.fillRect(24, 20, 4, 6);
        graphics.fillRect(40, 20, 4, 6);

        graphics.generateTexture(key, 48, 64);
        graphics.destroy();
    }

    private static generateIronSpikedWall(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // Fortified Stone Base (48x80)
        graphics.fillStyle(0x263238, 1);
        graphics.fillRect(0, 16, 48, 64);
        graphics.fillStyle(0x37474f, 1);
        graphics.fillRect(2, 18, 44, 60);

        // Iron Plating Sheets
        graphics.fillStyle(0x546e7a, 1);
        graphics.fillRect(6, 24, 36, 48);
        graphics.fillStyle(0x78909c, 1);
        graphics.fillRect(8, 26, 32, 44);

        // Heavy Iron Rivets
        graphics.fillStyle(0x263238, 1);
        for (let y = 28; y <= 66; y += 12) {
            graphics.fillRect(10, y, 3, 3);
            graphics.fillRect(35, y, 3, 3);
            graphics.fillStyle(0xffffff, 0.8);
            graphics.fillRect(10, y, 1, 1);
            graphics.fillRect(35, y, 1, 1);
            graphics.fillStyle(0x263238, 1);
        }

        // Row of Jagged Iron Spikes on Front Parapet (Reflects Thorns Damage)
        for (let x = 4; x < 48; x += 10) {
            graphics.fillStyle(0x263238, 1);
            graphics.beginPath();
            graphics.moveTo(x - 3, 16);
            graphics.lineTo(x + 2, 0);
            graphics.lineTo(x + 7, 16);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0xb0bec5, 1);
            graphics.beginPath();
            graphics.moveTo(x - 1, 15);
            graphics.lineTo(x + 2, 2);
            graphics.lineTo(x + 5, 15);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(x + 1, 2, 2, 4);
        }

        graphics.generateTexture(key, 48, 80);
        graphics.destroy();
    }

    private static generateWatchtower(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // 4 Timber Support Pillars (48x96)
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(4, 36, 6, 60);
        graphics.fillRect(38, 36, 6, 60);

        // Diagonal Cross Braces
        graphics.lineStyle(2, 0x4e342e, 1);
        graphics.beginPath();
        graphics.moveTo(6, 40);
        graphics.lineTo(42, 90);
        graphics.moveTo(42, 40);
        graphics.lineTo(6, 90);
        graphics.strokePath();

        // Central Wooden Ladder
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(20, 36, 2, 60);
        graphics.fillRect(26, 36, 2, 60);
        for (let y = 40; y < 96; y += 8) {
            graphics.fillRect(20, y, 8, 2);
        }

        // Elevated Archer Sniper Platform (Perch at y=36)
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(0, 32, 48, 6);
        graphics.fillStyle(0x8d6e63, 1);
        graphics.fillRect(2, 33, 44, 4);

        // Platform Safety Railing
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(0, 20, 4, 12);
        graphics.fillRect(44, 20, 4, 12);
        graphics.fillRect(0, 20, 48, 3);

        // Thatched Straw Roof Canopy
        graphics.fillStyle(0xda9100, 1);
        graphics.beginPath();
        graphics.moveTo(0, 14);
        graphics.lineTo(24, 0);
        graphics.lineTo(48, 14);
        graphics.closePath();
        graphics.fillPath();

        graphics.generateTexture(key, 48, 96);
        graphics.destroy();
    }

    // Returns true if the key should use a real sprite sheet instead of the programmatic fallback
    static isRealSprite(scene: Phaser.Scene, key: string): boolean {
        return SPRITE_SHEET_KEYS.has(key) && scene.textures.exists(key);
    }

    private static generateWallFoundationMound(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Earthen Dirt Base Mound (48px wide x 24px high)
        graphics.fillStyle(0x3e2723, 1);
        graphics.beginPath();
        graphics.moveTo(0, 24);
        graphics.lineTo(8, 12);
        graphics.lineTo(24, 6);
        graphics.lineTo(40, 12);
        graphics.lineTo(48, 24);
        graphics.closePath();
        graphics.fillPath();

        // Top Soil / Moss Layer
        graphics.fillStyle(0x558b2f, 1);
        graphics.fillRect(8, 12, 32, 3);
        graphics.fillRect(16, 8, 16, 4);

        // Cobblestone / Masonry Foundation Debris
        graphics.fillStyle(0x78909c, 1);
        graphics.fillRect(10, 14, 8, 6);
        graphics.fillRect(26, 12, 10, 7);
        graphics.fillRect(18, 16, 8, 5);

        // Stone Highlights & Shadows
        graphics.fillStyle(0x90a4ae, 1);
        graphics.fillRect(10, 14, 8, 2);
        graphics.fillRect(26, 12, 10, 2);
        graphics.fillStyle(0x37474f, 1);
        graphics.fillRect(10, 18, 8, 2);
        graphics.fillRect(26, 17, 10, 2);

        // Wooden Construction Stake / Mallet
        graphics.fillStyle(0x8d6e63, 1);
        graphics.fillRect(4, 10, 4, 12);
        graphics.fillRect(40, 10, 4, 12);
        graphics.fillStyle(0xd7ccc8, 1);
        graphics.fillRect(4, 8, 4, 2);
        graphics.fillRect(40, 8, 4, 2);

        graphics.generateTexture(key, 48, 24);
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

    private static generateBuilderUnit(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Head / Skin
        graphics.fillStyle(0xf5cda0, 1);
        graphics.fillRect(12, 6, 8, 8);
        // Yellow builder hardcap
        graphics.fillStyle(0xe5a93b, 1);
        graphics.fillRect(10, 3, 12, 5);
        // Eyes
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(17, 9, 2, 2);
        // Heavy work shirt (orange/brown)
        graphics.fillStyle(0xd35400, 1);
        graphics.fillRect(10, 13, 12, 11);
        // Leather Tool Apron
        graphics.fillStyle(0x795548, 1);
        graphics.fillRect(12, 15, 8, 9);
        // Heavy Hammer held in hand
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(22, 6, 3, 14);
        graphics.fillStyle(0xb0c4de, 1);
        graphics.fillRect(19, 4, 9, 5);
        // Legs / Boots
        graphics.fillStyle(0x2d3436, 1);
        graphics.fillRect(11, 24, 4, 6);
        graphics.fillRect(17, 24, 4, 6);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateWallStonePristine(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Heavy Oak Timber Frame Base & Posts
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(0, 0, 48, 80);
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(2, 2, 44, 76);

        // Stone Brick Masonry Courses
        const colors = [0x78909c, 0x607d8b, 0x546e7a, 0x455a64];
        for (let y = 16; y < 80; y += 12) {
            const isOffset = (y / 12) % 2 === 0;
            const step = 14;
            for (let x = 4; x < 44; x += step) {
                const brickX = isOffset ? x : x - 7;
                if (brickX < 4 || brickX + 12 > 44) continue;
                const c = colors[(x + y) % colors.length];
                graphics.fillStyle(c, 1);
                graphics.fillRect(brickX, y, 12, 10);
                graphics.fillStyle(0x90a4ae, 1);
                graphics.fillRect(brickX, y, 12, 2); // Highlight
                graphics.fillStyle(0x263238, 1);
                graphics.fillRect(brickX, y + 8, 12, 2); // Mortar shadow
            }
        }

        // Battlement Crenellations (Top Parapet)
        graphics.fillStyle(0x90a4ae, 1);
        graphics.fillRect(4, 0, 12, 16);
        graphics.fillRect(32, 0, 12, 16);
        graphics.fillStyle(0xb0bec5, 1);
        graphics.fillRect(4, 0, 12, 3);
        graphics.fillRect(32, 0, 12, 3);

        graphics.generateTexture(key, 48, 80);
        graphics.destroy();
    }

    private static generateWallStoneCracked(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Base pristine structure
        this.generateWallStonePristine(scene, "tmp_wall_pristine");
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(0, 0, 48, 80);
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(2, 2, 44, 76);

        const colors = [0x78909c, 0x607d8b, 0x546e7a, 0x455a64];
        for (let y = 16; y < 80; y += 12) {
            const isOffset = (y / 12) % 2 === 0;
            const step = 14;
            for (let x = 4; x < 44; x += step) {
                const brickX = isOffset ? x : x - 7;
                if (brickX < 4 || brickX + 12 > 44) continue;
                const c = colors[(x + y) % colors.length];
                graphics.fillStyle(c, 1);
                graphics.fillRect(brickX, y, 12, 10);
            }
        }

        // Crenellations
        graphics.fillStyle(0x90a4ae, 1);
        graphics.fillRect(4, 0, 12, 16);
        graphics.fillRect(32, 0, 12, 16);

        // Cracks & Fractures
        graphics.lineStyle(2, 0x1a2421, 1);
        graphics.beginPath();
        graphics.moveTo(12, 8);
        graphics.lineTo(20, 32);
        graphics.lineTo(14, 56);
        graphics.lineTo(24, 78);
        graphics.strokePath();

        graphics.generateTexture(key, 48, 80);
        graphics.destroy();
    }

    private static generateWallStoneCrumbling(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });

        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(0, 0, 48, 80);
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(2, 2, 44, 76);

        const colors = [0x78909c, 0x607d8b, 0x546e7a, 0x455a64];
        for (let y = 16; y < 80; y += 12) {
            const isOffset = (y / 12) % 2 === 0;
            for (let x = 4; x < 44; x += 14) {
                const brickX = isOffset ? x : x - 7;
                if (brickX < 4 || brickX + 12 > 44) continue;
                graphics.fillStyle(colors[(x + y) % colors.length], 1);
                graphics.fillRect(brickX, y, 12, 10);
            }
        }

        // Broken Parapet (Left crenellation shattered)
        graphics.fillStyle(0x90a4ae, 1);
        graphics.fillRect(32, 0, 12, 16);
        graphics.fillRect(4, 8, 8, 8);

        // Deep Fractures & Missing Stone Chunks
        graphics.lineStyle(3, 0x111111, 1);
        graphics.beginPath();
        graphics.moveTo(4, 16);
        graphics.lineTo(18, 38);
        graphics.lineTo(10, 60);
        graphics.lineTo(28, 80);
        graphics.strokePath();

        graphics.fillStyle(0x1a1a1a, 0.8);
        graphics.fillRect(6, 24, 8, 8);
        graphics.fillRect(28, 48, 10, 12);

        graphics.generateTexture(key, 48, 80);
        graphics.destroy();
    }

    private static generateWallStoneCritical(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Wall partially collapsed (Top half mostly destroyed)
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(0, 30, 48, 50);
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(2, 32, 44, 46);

        const colors = [0x607d8b, 0x546e7a, 0x455a64];
        for (let y = 36; y < 80; y += 12) {
            for (let x = 4; x < 44; x += 14) {
                graphics.fillStyle(colors[(x + y) % colors.length], 1);
                graphics.fillRect(x, y, 10, 10);
            }
        }

        // Heavy gaping breaches and exposed timber splinters
        graphics.lineStyle(4, 0x0a0a0a, 1);
        graphics.beginPath();
        graphics.moveTo(0, 30);
        graphics.lineTo(20, 54);
        graphics.lineTo(12, 80);
        graphics.moveTo(48, 30);
        graphics.lineTo(30, 58);
        graphics.strokePath();

        graphics.fillStyle(0x000000, 0.9);
        graphics.fillRect(16, 40, 16, 20);

        graphics.generateTexture(key, 48, 80);
        graphics.destroy();
    }

    private static generateWallRubbleCollapsed(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Collapsed Rubble & Stone Debris Mound (48px wide x 24px high)
        graphics.fillStyle(0x212121, 1);
        graphics.beginPath();
        graphics.moveTo(0, 24);
        graphics.lineTo(10, 8);
        graphics.lineTo(28, 4);
        graphics.lineTo(48, 24);
        graphics.closePath();
        graphics.fillPath();

        // Shattered Stone Blocks
        graphics.fillStyle(0x546e7a, 1);
        graphics.fillRect(6, 12, 10, 8);
        graphics.fillRect(24, 10, 12, 8);
        graphics.fillRect(16, 14, 10, 6);

        // Broken Splintered Timber
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(2, 16, 16, 4);
        graphics.fillRect(30, 14, 14, 4);

        graphics.generateTexture(key, 48, 24);
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
