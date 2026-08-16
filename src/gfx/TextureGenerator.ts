import Phaser from "phaser";
import { FactionValues, CombatTypeValues } from "../ecs/components";

export function getUnitTextureKey(faction: number, combatType: number, isFlying: boolean, role?: number): string {
    if (faction === FactionValues.Hero) {
        if (role === 0) return "peasant_unit"; // Peasant
        if (role === 1) return "peasant_unit"; // Builder (maybe reuse peasant or give builder skin) - wait let's use peasant
        if (isFlying) return "unit_valkyrie";
        if (combatType === CombatTypeValues.Melee) return "unit_knight";
        if (combatType === CombatTypeValues.Ranged) return "unit_archer";
        if (combatType === CombatTypeValues.Magic) return "unit_mage";
        return "unit_knight"; // fallback
    } else {
        if (combatType === CombatTypeValues.Melee) return "unit_troll";
        if (combatType === CombatTypeValues.Ranged) return "unit_goblin";
        if (combatType === CombatTypeValues.Magic) return "unit_cultist";
        return "unit_goblin";
    }
}

export class TextureGenerator {
    static generateAll(scene: Phaser.Scene) {
        // Environment Parallax
        this.generatePixelBg(scene, "bg_sky", 800, 600, "#87CEEB", "#1E90FF");
        this.generateMountains(scene, "bg_mountains");
        this.generatePixelBg(scene, "bg_trees", 800, 200, "#228B22", "#006400");
        this.generatePixelBg(scene, "ground_tile", 64, 64, "#8B4513", "#5C4033");

        // Camp
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
        this.generatePixelBg(scene, "spire_floor_platform", 128, 16, "#8B4513", "#654321");
        this.generateRect(scene, "spire_barricade_gate", 32, 64, "#4B0082");
        this.generateDarkCrystal(scene, "spire_dark_crystal");

        // Recruitment & Tool Stands
        this.generateToolHammerStand(scene, "tool_hammer_stand");
        this.generateToolBowStand(scene, "tool_bow_stand");
        this.generateToolSwordStand(scene, "tool_sword_stand");

        // Units
        this.generatePeasantUnit(scene, "peasant_unit");
        this.generateKnight(scene, "unit_knight");
        this.generateArcher(scene, "unit_archer");
        this.generateMage(scene, "unit_mage");
        this.generateValkyrie(scene, "unit_valkyrie");

        this.generateGoblin(scene, "unit_goblin");
        this.generateTroll(scene, "unit_troll");
        this.generateCultist(scene, "unit_cultist");
    }

    private static generateWallFoundationMound(scene: Phaser.Scene, key: string) {
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

    private static generateToolHammerStand(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(8, 16, 16, 16); // Stand
        graphics.fillStyle(0x95a5a6, 1);
        graphics.fillRect(10, 4, 12, 6); // Hammer head
        graphics.fillStyle(0x5C4033, 1);
        graphics.fillRect(14, 10, 4, 10); // Hammer handle
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateToolBowStand(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(8, 16, 16, 16); // Stand
        graphics.fillStyle(0xd35400, 1);
        graphics.fillRect(14, 0, 4, 20); // Bow
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generateToolSwordStand(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(8, 16, 16, 16); // Stand
        graphics.fillStyle(0xecf0f1, 1);
        graphics.fillRect(14, 0, 4, 16); // Sword blade
        graphics.fillStyle(0xf1c40f, 1);
        graphics.fillRect(10, 16, 12, 2); // Sword hilt
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    private static generatePeasantUnit(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Face Shadow
        graphics.fillStyle(0x1e372e, 1);
        graphics.fillRect(10, 6, 4, 4);
        // Body (rags)
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(8, 12, 8, 8);
        graphics.generateTexture(key, 24, 24);
        graphics.destroy();
    }

    private static generateWallStonePristine(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(0, 0, 32, 128);
        graphics.generateTexture(key, 32, 128);
        graphics.destroy();
    }

    private static generateWallStoneCracked(scene: Phaser.Scene, key: string) {
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

    private static generateRect(scene: Phaser.Scene, key: string, width: number, height: number, colorStr: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colorStr).color, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    private static generatePixelBg(scene: Phaser.Scene, key: string, width: number, height: number, color1: string, color2: string) {
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
    }

    private static generateCampCore(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Tent
        graphics.fillStyle(0x8B4513, 1);
        graphics.beginPath();
        graphics.moveTo(16, 64);
        graphics.lineTo(32, 16);
        graphics.lineTo(48, 64);
        graphics.fillPath();

        // Hearth
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(20, 50, 24, 14);
        // Fire / Core
        graphics.fillStyle(0xe67e22, 1);
        graphics.fillCircle(32, 44, 8);
        graphics.fillStyle(0x55efc4, 1);
        graphics.fillCircle(32, 44, 4);

        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    private static generateCutawayWall(scene: Phaser.Scene, key: string) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const c1 = 0x2f3542;
        const c2 = 0x1e272e;
        for (let y = 0; y < 64; y += 16) {
            for (let x = 0; x < 128; x += 32) {
                const offset = (y % 32 === 0) ? 0 : 16;
                graphics.fillStyle(c1, 1);
                graphics.fillRect(x + offset, y, 30, 14);
                graphics.fillStyle(c2, 1);
                graphics.fillRect(x + offset + 30, y, 2, 16);
                graphics.fillRect(x + offset, y + 14, 32, 2);
            }
        }
        // Arch cutouts
        graphics.fillStyle(0x0d0f18, 1);
        graphics.fillRect(32, 24, 64, 40);
        graphics.generateTexture(key, 128, 64);
        graphics.destroy();
    }

    private static generateDarkCrystal(scene: Phaser.Scene, key: string) {
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
