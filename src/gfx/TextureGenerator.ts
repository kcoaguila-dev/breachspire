import Phaser from "phaser";
import { FactionValues, CombatTypeValues } from "../ecs/components";

export function getUnitTextureKey(faction: number, combatType: number, isFlying: boolean, role?: number): string {
    if (faction === FactionValues.Hero) {
        if (role === 4) return "unit_vagrant"; // Grayish Vagrant Wanderer
        if (role === 0) return "peasant_unit"; // Citizen (green tunic)
        if (role === 1) return "builder_unit"; // Builder (orange/apron)
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

        // Vagrant, Peasant & Builder (generated pixel art)
        this.generateVagrantUnit(scene, "unit_vagrant");
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

        // Harvestable nodes & Trees (Kingdom Two Crowns Scale)
        this.generatePineTree(scene, "node_pine_tree");
        this.generateAncientOak(scene, "tree_ancient_oak");
        this.generateTallPine(scene, "tree_tall_pine");
        this.generateAutumnBirch(scene, "tree_autumn_birch");
        this.generateIronOre(scene, "node_iron_ore");
        this.generateBloodMoon(scene, "moon_blood_red");
        // Tiered Walls & Structures
        this.generateWoodPalisade(scene, "wall_wood_palisade");
        this.generateIronSpikedWall(scene, "wall_iron_spikes");
        this.generateWatchtower(scene, "watchtower_structure");
        this.generateWarehouse(scene, "tool_warehouse");
        this.generateVagrantPortal(scene, "poi_vagrant_portal");
    }

    private static generateVagrantPortal(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // 1. Stone Dias Foundation (y = 54..64)
        graphics.fillStyle(0x1e272e, 1);
        graphics.fillRect(4, 56, 56, 8);
        graphics.fillStyle(0x2f3640, 1);
        graphics.fillRect(6, 54, 52, 4);
        graphics.fillStyle(0x718093, 1);
        graphics.fillRect(8, 54, 48, 2);

        // Ground Ivy / Moss
        graphics.fillStyle(0x2ed573, 0.8);
        graphics.fillRect(10, 56, 6, 2);
        graphics.fillRect(20, 58, 8, 2);
        graphics.fillRect(44, 56, 6, 2);

        // 2. Cosmic Void / Aether Portal Vortex (Inside Arch: x = 16..48, y = 14..54)
        graphics.fillStyle(0x0a0314, 1);
        graphics.fillRect(16, 14, 32, 40);

        // Outer Nebula Glow
        graphics.fillStyle(0x2c003e, 1);
        graphics.fillRect(18, 16, 28, 36);

        // Deep Purple Void
        graphics.fillStyle(0x511281, 1);
        graphics.fillRect(20, 18, 24, 32);

        // Electric Violet Swirls
        graphics.fillStyle(0x822659, 1);
        graphics.fillRect(22, 22, 20, 24);
        graphics.fillStyle(0xb83b5e, 1);
        graphics.fillRect(24, 26, 16, 16);

        // Radiant Cyan Core & Starlight Motes
        graphics.fillStyle(0x00f2fe, 1);
        graphics.fillRect(28, 30, 8, 8);
        graphics.fillRect(26, 32, 12, 4);
        graphics.fillStyle(0x4facfe, 1);
        graphics.fillRect(20, 24, 2, 2);
        graphics.fillRect(42, 38, 2, 2);
        graphics.fillRect(22, 44, 2, 2);
        graphics.fillRect(38, 20, 2, 2);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(30, 32, 4, 4);

        // 3. Ancient Weathered Runic Megalith Pillars
        // Left Pillar (x = 6..18, y = 10..54)
        graphics.fillStyle(0x1e272e, 1);
        graphics.fillRect(6, 10, 12, 46);
        graphics.fillStyle(0x353b48, 1);
        graphics.fillRect(8, 12, 8, 42);
        graphics.fillStyle(0x57606f, 1);
        graphics.fillRect(8, 12, 4, 42);
        // Stone Cracks & Notches
        graphics.fillStyle(0x1e272e, 1);
        graphics.fillRect(12, 24, 4, 2);
        graphics.fillRect(8, 36, 6, 2);
        graphics.fillRect(10, 48, 4, 2);

        // Right Pillar (x = 46..58, y = 10..54)
        graphics.fillStyle(0x1e272e, 1);
        graphics.fillRect(46, 10, 12, 46);
        graphics.fillStyle(0x353b48, 1);
        graphics.fillRect(48, 12, 8, 42);
        graphics.fillStyle(0x57606f, 1);
        graphics.fillRect(48, 12, 4, 42);
        // Stone Cracks
        graphics.fillStyle(0x1e272e, 1);
        graphics.fillRect(48, 20, 4, 2);
        graphics.fillRect(52, 34, 4, 2);
        graphics.fillRect(48, 46, 6, 2);

        // 4. Heavy Keystone Arch (Top: x = 6..58, y = 6..16)
        graphics.fillStyle(0x1e272e, 1);
        graphics.fillRect(4, 6, 56, 10);
        graphics.fillStyle(0x353b48, 1);
        graphics.fillRect(6, 8, 52, 6);
        graphics.fillStyle(0x718093, 1);
        graphics.fillRect(6, 8, 52, 2);
        // Center Keystone
        graphics.fillStyle(0x2f3640, 1);
        graphics.fillRect(28, 4, 8, 12);
        graphics.fillStyle(0x718093, 1);
        graphics.fillRect(29, 5, 6, 2);

        // 5. Glowing Ancient Cyan / Violet Runes on Arch & Pillars
        graphics.fillStyle(0x00f2fe, 1);
        graphics.fillRect(10, 18, 4, 2);
        graphics.fillRect(10, 30, 4, 2);
        graphics.fillRect(12, 32, 2, 4);
        graphics.fillRect(10, 42, 4, 2);

        graphics.fillRect(50, 18, 4, 2);
        graphics.fillRect(50, 28, 2, 4);
        graphics.fillRect(50, 40, 4, 2);

        graphics.fillRect(20, 10, 4, 2);
        graphics.fillRect(30, 8, 4, 2);
        graphics.fillRect(40, 10, 4, 2);

        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    private static generateBloodMoon(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // Outer Crimson Glow Aura (64x64)
        graphics.fillStyle(0xb71c1c, 0.25);
        graphics.fillCircle(32, 32, 30);
        graphics.fillStyle(0xd32f2f, 0.45);
        graphics.fillCircle(32, 32, 24);

        // Blood Moon Disc
        graphics.fillStyle(0xff1744, 1);
        graphics.fillCircle(32, 32, 18);
        graphics.fillStyle(0xff5252, 1);
        graphics.fillCircle(30, 30, 15);

        // Dark Eclipse Craters & Textures
        graphics.fillStyle(0x880e4f, 0.7);
        graphics.fillCircle(25, 27, 4);
        graphics.fillCircle(35, 34, 5);
        graphics.fillCircle(28, 37, 3);
        graphics.fillCircle(37, 24, 2.5);

        // Inner Core Glow
        graphics.fillStyle(0xff8a80, 0.8);
        graphics.fillCircle(28, 28, 6);

        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    private static generateAncientOak(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();
        const cx = 56;

        const drawPix = (x: number, y: number, w: number, h: number, color: number) => {
            graphics.fillStyle(color, 1);
            graphics.fillRect(x, y, w, h);
        };

        // ── 1. Gnarled Woody Trunk & Roots (y = 110..220) ──
        // Root base flare (y = 190..220)
        drawPix(cx - 30, 212, 60, 8, 0x1a0f08);
        drawPix(cx - 24, 204, 48, 8, 0x27150c);
        drawPix(cx - 18, 192, 36, 12, 0x361d11);
        drawPix(cx - 14, 175, 28, 17, 0x482818);
        drawPix(cx - 11, 110, 22, 65, 0x482818);

        // Bark striations, cracks and knots
        drawPix(cx - 8, 115, 6, 75, 0x5c331f);
        drawPix(cx - 2, 120, 8, 70, 0x6e3f28);
        drawPix(cx + 4, 130, 4, 55, 0x824e33);
        drawPix(cx - 6, 185, 8, 4, 0x1a0f08); // knot
        drawPix(cx + 2, 150, 6, 5, 0x1a0f08); // knot

        // Heavy Gnarled Branches
        // Left Branch
        drawPix(cx - 28, 105, 20, 8, 0x361d11);
        drawPix(cx - 38, 95, 14, 10, 0x482818);
        drawPix(cx - 44, 85, 10, 10, 0x361d11);

        // Right Branch
        drawPix(cx + 8, 110, 22, 8, 0x361d11);
        drawPix(cx + 24, 100, 16, 10, 0x482818);
        drawPix(cx + 34, 90, 12, 10, 0x361d11);

        // Moss on base
        drawPix(cx - 22, 210, 12, 4, 0x1e5c26);
        drawPix(cx + 12, 208, 10, 4, 0x2f8238);

        // ── 2. Pixelated Leafy Canopy (y = 12..140) ──
        // Layer 1: Deep Underbelly Shadow (0x071b0e / 0x0e3019)
        const darkBands = [
            { x: cx - 44, y: 100, w: 88, h: 26 },
            { x: cx - 50, y: 76,  w: 100, h: 30 },
            { x: cx - 46, y: 50,  w: 92, h: 32 },
            { x: cx - 36, y: 30,  w: 72, h: 26 },
            { x: cx - 22, y: 16,  w: 44, h: 18 }
        ];
        for (const b of darkBands) {
            drawPix(b.x, b.y, b.w, b.h, 0x0a2414);
        }

        // Layer 2: Forest Emerald Midtone (0x175227)
        const midBands = [
            { x: cx - 40, y: 92,  w: 80, h: 24 },
            { x: cx - 46, y: 70,  w: 92, h: 28 },
            { x: cx - 42, y: 44,  w: 84, h: 30 },
            { x: cx - 32, y: 24,  w: 64, h: 24 },
            { x: cx - 18, y: 12,  w: 36, h: 16 }
        ];
        for (const b of midBands) {
            drawPix(b.x, b.y, b.w, b.h, 0x19572b);
        }

        // Layer 3: Vibrant Green Leaf Clusters (0x28853e)
        const greenBands = [
            { x: cx - 36, y: 84,  w: 72, h: 20 },
            { x: cx - 42, y: 62,  w: 84, h: 22 },
            { x: cx - 36, y: 38,  w: 72, h: 24 },
            { x: cx - 26, y: 18,  w: 52, h: 20 },
            { x: cx - 12, y: 8,   w: 24, h: 14 }
        ];
        for (const b of greenBands) {
            drawPix(b.x, b.y, b.w, b.h, 0x2e8b45);
        }

        // Layer 4: Bright Foliage Texture & Sunlit Puffs (0x46b45f)
        const brightPuffs = [
            // Left Puff
            { x: cx - 40, y: 55, w: 28, h: 18 },
            { x: cx - 36, y: 40, w: 24, h: 16 },
            // Right Puff
            { x: cx + 12, y: 52, w: 28, h: 18 },
            { x: cx + 14, y: 38, w: 22, h: 16 },
            // Center-Top Puff
            { x: cx - 18, y: 14, w: 36, h: 20 },
            { x: cx - 24, y: 32, w: 48, h: 22 }
        ];
        for (const p of brightPuffs) {
            drawPix(p.x, p.y, p.w, p.h, 0x4bb565);
        }

        // Layer 5: Golden Sunlight Rims & Dithered Highlights (0x80dc8b / 0xc5f5a8)
        const rims = [
            { x: cx - 16, y: 8,   w: 32, h: 6 },
            { x: cx - 10, y: 4,   w: 20, h: 5 },
            { x: cx - 38, y: 48,  w: 16, h: 5 },
            { x: cx - 34, y: 36,  w: 14, h: 4 },
            { x: cx + 16, y: 46,  w: 18, h: 5 },
            { x: cx + 18, y: 34,  w: 14, h: 4 },
            { x: cx - 20, y: 28,  w: 24, h: 5 },
            { x: cx + 6,  y: 28,  w: 18, h: 5 }
        ];
        for (const r of rims) {
            drawPix(r.x, r.y, r.w, r.h, 0x8ce093);
        }

        // Dithered highlight sparkles (Kingdom sun-kissed pixels)
        const specks = [
            { x: cx - 6, y: 2, w: 12, h: 3 },
            { x: cx - 32, y: 34, w: 6, h: 3 },
            { x: cx + 22, y: 32, w: 6, h: 3 },
            { x: cx - 14, y: 26, w: 8, h: 3 },
            { x: cx + 10, y: 26, w: 8, h: 3 }
        ];
        for (const s of specks) {
            drawPix(s.x, s.y, s.w, s.h, 0xd2f8b0);
        }

        graphics.generateTexture(key, 112, 220);
        graphics.destroy();
    }

    private static generateTallPine(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();
        const cx = 40; // 80 x 230 px

        const drawPix = (x: number, y: number, w: number, h: number, color: number) => {
            graphics.fillStyle(color, 1);
            graphics.fillRect(x, y, w, h);
        };

        // ── 1. Alpine Cedar Trunk (y = 90..230) ──
        drawPix(cx - 10, 218, 20, 12, 0x1f140e);
        drawPix(cx - 7, 180, 14, 38, 0x2e1d14);
        drawPix(cx - 5, 90, 10, 90, 0x422a1d);
        drawPix(cx - 2, 90, 5, 130, 0x5c3d2c);
        drawPix(cx + 1, 100, 2, 110, 0x78513b);

        // ── 2. 6 Tiers of Stepped Pixelated Pine Boughs ──
        const tiers = [
            { y: 155, w: 72, h: 38, shadow: 0x071c10, mid: 0x124021, bright: 0x226b38, rim: 0x489e61 },
            { y: 125, w: 62, h: 34, shadow: 0x071c10, mid: 0x124021, bright: 0x226b38, rim: 0x489e61 },
            { y: 95,  w: 52, h: 32, shadow: 0x0e301a, mid: 0x19522b, bright: 0x2e8547, rim: 0x5bb875 },
            { y: 68,  w: 42, h: 30, shadow: 0x0e301a, mid: 0x19522b, bright: 0x2e8547, rim: 0x5bb875 },
            { y: 42,  w: 30, h: 28, shadow: 0x144023, mid: 0x226b38, bright: 0x3da05a, rim: 0x76d490 },
            { y: 16,  w: 18, h: 26, shadow: 0x19522b, mid: 0x2e8547, bright: 0x4eb86d, rim: 0x9be8ad },
        ];

        for (const t of tiers) {
            // Stepped pixel triangle (shadow)
            for (let row = 0; row < t.h; row += 4) {
                const rw = Math.round((t.w * (row + 4)) / t.h);
                drawPix(cx - rw / 2, t.y + row, rw, 4, t.shadow);
            }
            // Midtone body
            for (let row = 4; row < t.h - 4; row += 4) {
                const rw = Math.round(((t.w - 6) * (row + 2)) / t.h);
                drawPix(cx - rw / 2, t.y + row, rw, 4, t.mid);
            }
            // Bright cluster
            for (let row = 8; row < t.h - 8; row += 4) {
                const rw = Math.round(((t.w - 14) * row) / t.h);
                drawPix(cx - rw / 2, t.y + row, rw, 4, t.bright);
            }
            // Top needle ridge
            drawPix(cx - (t.w / 4), t.y + 4, t.w / 2, 4, t.rim);
            drawPix(cx - (t.w / 6), t.y + 2, t.w / 3, 2, 0xd0f8c8);
        }

        // Apex Pine Tip
        drawPix(cx - 3, 10, 6, 6, 0x4eb86d);
        drawPix(cx - 2, 6,  4, 4, 0x76d490);
        drawPix(cx - 1, 2,  2, 4, 0xd0f8c8);

        graphics.generateTexture(key, 80, 230);
        graphics.destroy();
    }

    private static generateAutumnBirch(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();
        const cx = 48; // 96 x 190 px

        const drawPix = (x: number, y: number, w: number, h: number, color: number) => {
            graphics.fillStyle(color, 1);
            graphics.fillRect(x, y, w, h);
        };

        // ── 1. White/Grey Birch Trunk with Dark Notches (y = 80..190) ──
        drawPix(cx - 8, 180, 16, 10, 0x222a30);
        drawPix(cx - 6, 80, 12, 100, 0x8a99a8);
        drawPix(cx - 4, 80, 8, 100, 0xcdd5de);
        drawPix(cx - 2, 80, 4, 100, 0xf0f3f6);

        // Birch Horizontal Bark Notches
        const notches = [
            { y: 95,  x: cx - 6, w: 6, h: 3 },
            { y: 112, x: cx + 1, w: 5, h: 3 },
            { y: 128, x: cx - 5, w: 7, h: 3 },
            { y: 145, x: cx + 2, w: 4, h: 4 },
            { y: 162, x: cx - 6, w: 8, h: 3 },
            { y: 176, x: cx,     w: 6, h: 4 }
        ];
        for (const n of notches) {
            drawPix(n.x, n.y, n.w, n.h, 0x1e272e);
        }

        // ── 2. Pixelated Golden Amber & Russet Autumn Foliage (y = 10..110) ──
        // Layer 1: Dark Russet Shadow (0x4a0e05 / 0x781d0a)
        const darkBands = [
            { x: cx - 36, y: 78, w: 72, h: 24 },
            { x: cx - 42, y: 56, w: 84, h: 26 },
            { x: cx - 38, y: 36, w: 76, h: 24 },
            { x: cx - 26, y: 18, w: 52, h: 20 },
            { x: cx - 14, y: 8,  w: 28, h: 14 }
        ];
        for (const b of darkBands) {
            drawPix(b.x, b.y, b.w, b.h, 0x781d0a);
        }

        // Layer 2: Vibrant Crimson-Orange (0xb8380b)
        const orangeBands = [
            { x: cx - 32, y: 70, w: 64, h: 20 },
            { x: cx - 38, y: 50, w: 76, h: 22 },
            { x: cx - 34, y: 30, w: 68, h: 22 },
            { x: cx - 22, y: 14, w: 44, h: 18 },
            { x: cx - 10, y: 6,  w: 20, h: 12 }
        ];
        for (const b of orangeBands) {
            drawPix(b.x, b.y, b.w, b.h, 0xc2410c);
        }

        // Layer 3: Warm Amber Gold Leaf Clusters (0xe67e22)
        const goldBands = [
            { x: cx - 26, y: 62, w: 52, h: 18 },
            { x: cx - 32, y: 42, w: 64, h: 20 },
            { x: cx - 28, y: 24, w: 56, h: 20 },
            { x: cx - 18, y: 10, w: 36, h: 16 }
        ];
        for (const b of goldBands) {
            drawPix(b.x, b.y, b.w, b.h, 0xea580c);
        }

        // Layer 4: Glowing Golden Yellow (0xf59e0b)
        const yellowPuffs = [
            { x: cx - 30, y: 36, w: 24, h: 16 },
            { x: cx + 8,  y: 34, w: 22, h: 16 },
            { x: cx - 16, y: 12, w: 32, h: 18 },
            { x: cx - 20, y: 22, w: 40, h: 16 }
        ];
        for (const p of yellowPuffs) {
            drawPix(p.x, p.y, p.w, p.h, 0xf59e0b);
        }

        // Layer 5: Bright Sunlit Amber Rims (0xfde68a)
        const highlights = [
            { x: cx - 12, y: 6,  w: 24, h: 4 },
            { x: cx - 26, y: 26, w: 14, h: 4 },
            { x: cx + 12, y: 24, w: 14, h: 4 },
            { x: cx - 8,  y: 18, w: 16, h: 4 }
        ];
        for (const h of highlights) {
            drawPix(h.x, h.y, h.w, h.h, 0xfde68a);
        }

        graphics.generateTexture(key, 96, 190);
        graphics.destroy();
    }

    private static generatePineTree(scene: Phaser.Scene, key: string) {
        // Fallback default pine uses Ancient Oak scale
        this.generateAncientOak(scene, key);
    }

    private static generateWarehouse(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();

        // Stone Foundation Base (48x48)
        graphics.fillStyle(0x37474f, 1);
        graphics.fillRect(2, 40, 44, 8);
        graphics.fillStyle(0x546e7a, 1);
        graphics.fillRect(4, 40, 40, 3);

        // Timber Frame Shed
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(4, 16, 40, 24);
        graphics.fillStyle(0x5d4037, 1);
        graphics.fillRect(6, 18, 36, 22);

        // Open Storage Bay
        graphics.fillStyle(0x212121, 1);
        graphics.fillRect(8, 22, 32, 18);

        // Stacked Timber Logs (Left Side)
        graphics.fillStyle(0x8d6e63, 1);
        graphics.fillCircle(12, 35, 4);
        graphics.fillCircle(19, 35, 4);
        graphics.fillCircle(15, 29, 4);
        graphics.fillStyle(0xd7ccc8, 1);
        graphics.fillCircle(12, 35, 2);
        graphics.fillCircle(19, 35, 2);
        graphics.fillCircle(15, 29, 2);

        // Stacked Iron Ore Ingots (Right Side)
        graphics.fillStyle(0x78909c, 1);
        graphics.fillRect(26, 33, 12, 5);
        graphics.fillRect(28, 27, 8, 5);
        graphics.fillStyle(0xcfd8dc, 1);
        graphics.fillRect(27, 33, 10, 2);
        graphics.fillRect(29, 27, 6, 2);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(34, 28, 2, 2);
        graphics.fillRect(32, 34, 2, 2);

        // Slanted Shingle Roof
        graphics.fillStyle(0x4e342e, 1);
        graphics.beginPath();
        graphics.moveTo(0, 16);
        graphics.lineTo(24, 4);
        graphics.lineTo(48, 16);
        graphics.closePath();
        graphics.fillPath();

        graphics.fillStyle(0x6d4c41, 1);
        graphics.beginPath();
        graphics.moveTo(3, 15);
        graphics.lineTo(24, 6);
        graphics.lineTo(45, 15);
        graphics.closePath();
        graphics.fillPath();

        graphics.generateTexture(key, 48, 48);
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

    private static generateVagrantUnit(scene: Phaser.Scene, key: string) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        // Dusty/Paler Skin
        graphics.fillStyle(0xdfba96, 1);
        graphics.fillRect(12, 7, 8, 8);
        // Messy ragged dark grey hair
        graphics.fillStyle(0x3e3e3e, 1);
        graphics.fillRect(11, 4, 10, 4);
        graphics.fillRect(10, 6, 3, 5);
        // Eyes (slumped/weary)
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(17, 10, 2, 2);
        // Ragged grayish/drab tunic
        graphics.fillStyle(0x757575, 1);
        graphics.fillRect(10, 15, 12, 9);
        // Patch / dirt on tunic
        graphics.fillStyle(0x546e7a, 1);
        graphics.fillRect(12, 17, 3, 3);
        // Frayed rope belt
        graphics.fillStyle(0x424242, 1);
        graphics.fillRect(10, 20, 12, 2);
        // Bare dusty legs / frayed hem
        graphics.fillStyle(0x8d6e63, 1);
        graphics.fillRect(11, 24, 4, 6);
        graphics.fillRect(17, 24, 4, 6);
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
