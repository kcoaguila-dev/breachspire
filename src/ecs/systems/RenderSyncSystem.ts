import Phaser from "phaser";
import { defineQuery, IWorld, enterQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Position, FactionTag, FactionValues, Health, CampCoreComponent, CampWallComponent, SpireComponent, FloorComponent, GameStateComponent, GameStateValues, Velocity, CombatTypeComponent, CanReachElevated, WallBlueprint, WildernessPoiComponent, UnitRole, BlueprintStateValues, LevelUpEvent, DayNightCycle, AetherMoteComponent, AetherCollectEvent, PlayerControlled, HarvestableNode, HarvestableNodeValues, HarvestableStateValues, WallTierValues, WatchtowerComponent, TowerStateValues, TowerTierValues, CampStockComponent } from "../components";
import { getUnitTextureKey } from "../../gfx/TextureGenerator";
import { getAnimBaseKey } from "../../gfx/AnimationKeys";
import { getWallDamageStage } from "./CampSiegeSystem";
import { getAmbientLightingColor } from "./DayNightSystem";
import { computeInventoryUpgradeCost } from "./InventorySystem";
import { computeTowerUpgradeCost } from "./WatchtowerSystem";

export type RenderGameObject =
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Arc;

export type SpriteMap = Map<number, RenderGameObject>;

const dayNightQuery = defineQuery([DayNightCycle]);

const unitQuery = defineQuery([Position, FactionTag, Health, Velocity]); // CombatTypeComponent might be optional for peasants/builders
const unitQueryEnter = enterQuery(unitQuery);
const unitQueryExit = exitQuery(unitQuery);

const campCoreQuery = defineQuery([Position, CampCoreComponent]);
const campCoreQueryEnter = enterQuery(campCoreQuery);

const campWallQuery = defineQuery([Position, CampWallComponent, Health]);
const campWallQueryEnter = enterQuery(campWallQuery);

const watchtowerQuery = defineQuery([Position, WatchtowerComponent]);
const watchtowerQueryEnter = enterQuery(watchtowerQuery);
const watchtowerQueryExit = exitQuery(watchtowerQuery);

const spireQuery = defineQuery([Position, SpireComponent, Health]);
const spireQueryEnter = enterQuery(spireQuery);

const floorQuery = defineQuery([Position, FloorComponent]);
const floorQueryEnter = enterQuery(floorQuery);

const wallBlueprintQuery = defineQuery([WallBlueprint, Position]);
const wallBlueprintQueryEnter = enterQuery(wallBlueprintQuery);
const wallBlueprintQueryExit = exitQuery(wallBlueprintQuery);

const poiQuery = defineQuery([WildernessPoiComponent, Position]);
const poiQueryEnter = enterQuery(poiQuery);

const stateQuery = defineQuery([GameStateComponent]);

const playerQuery = defineQuery([PlayerControlled, Position]);

const levelUpEventQuery = defineQuery([LevelUpEvent]);

const moteQuery = defineQuery([AetherMoteComponent, Position]);
const moteQueryEnter = enterQuery(moteQuery);
const moteQueryExit = exitQuery(moteQuery);

const harvestableQuery = defineQuery([HarvestableNode, Position]);
const harvestableQueryEnter = enterQuery(harvestableQuery);
const harvestableQueryExit = exitQuery(harvestableQuery);

const aetherCollectEventQuery = defineQuery([AetherCollectEvent]);

export function createRenderSyncSystem(scene: Phaser.Scene, spriteMap: SpriteMap) {
  let victoryBanner: Phaser.GameObjects.Text | null = null;
  let defeatBanner: Phaser.GameObjects.Text | null = null;

  const ambientRect = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0xffffff, 1);
  ambientRect.setScrollFactor(0);
  (ambientRect as any).setDepth(99);

  // Floating prompt for building / hiring interactions
  const promptText = scene.add.text(0, 0, "", {
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#ffea00",
    backgroundColor: "#111111ee",
    padding: { x: 6, y: 3 }
  }).setOrigin(0.5).setDepth(200).setVisible(false);

  // Create UI elements
  const unitHpGraphicsMap = new Map<number, Phaser.GameObjects.Graphics>();

  return (world: IWorld) => {
    // 1. Units
    const unitsEntered = unitQueryEnter(world);
    for (let i = 0; i < unitsEntered.length; i++) {
      const eid = unitsEntered[i];
      const faction = FactionTag.faction[eid];
      let combatType = 0;
      if (hasComponent(world, CombatTypeComponent, eid)) {
          combatType = CombatTypeComponent.type[eid];
      }
      const isFlying = hasComponent(world, CanReachElevated, eid);
      const isPlayer = hasComponent(world, PlayerControlled, eid);
      const role = hasComponent(world, UnitRole, eid) ? UnitRole.role[eid] : undefined;
      const textureId = isPlayer ? "anim_commander" : getUnitTextureKey(faction, combatType, isFlying, role);
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], textureId);

      // Display at 2× the source pixel size — each pixel becomes a 2×2 block
      let displaySize = 96; // default: 48px × 2
      if (textureId === "anim_commander" || textureId === "steed_commander") {
        displaySize = 140; // 80px × 1.75 — generous frame for king on horse with sword
      } else if (textureId === "anim_troll" || textureId === "unit_troll") {
        displaySize = 128; // 64px × 2
      } else if (textureId === "anim_goblin" || textureId === "unit_goblin" || textureId === "anim_cultist" || textureId === "unit_cultist" || textureId === "peasant_unit" || textureId === "builder_unit") {
        displaySize = 80;  // 40px × 2
      }
      sprite.setDisplaySize(displaySize, displaySize);

      if (textureId.startsWith("anim_") && scene.anims.exists(`${textureId}_idle`)) {
        sprite.anims.play(`${textureId}_idle`);
      }

      spriteMap.set(eid, sprite);

      const hpGraphics = scene.add.graphics();
      unitHpGraphicsMap.set(eid, hpGraphics);
    }

    const units = unitQuery(world);
    for (let i = 0; i < units.length; i++) {
      const eid = units[i];
      const sprite = spriteMap.get(eid);
      const hpGraphics = unitHpGraphicsMap.get(eid);

      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        const velX    = Velocity.x[eid];
        const faction = FactionTag.faction[eid];
        const isDead  = Health.current[eid] <= 0;
        const isMoving = Math.abs(velX) > 5 || Math.abs(Velocity.y[eid]) > 5;

        // ── Dynamic Role / CombatType Texture Sync ────────────────────────────
        if (!isDead) {
          const combatType = hasComponent(world, CombatTypeComponent, eid)
            ? CombatTypeComponent.type[eid] : 0;
          const isFlying = hasComponent(world, CanReachElevated, eid);
          const role = hasComponent(world, UnitRole, eid) ? UnitRole.role[eid] : undefined;
          const isPlayer = hasComponent(world, PlayerControlled, eid);
          const expectedTexture = isPlayer
            ? "anim_commander"
            : getUnitTextureKey(faction, combatType, isFlying, role);

          if (sprite.texture.key !== expectedTexture && scene.textures.exists(expectedTexture)) {
            sprite.setTexture(expectedTexture);
            let displaySize = 96;
            if (expectedTexture === "anim_commander" || expectedTexture === "steed_commander") displaySize = 140;
            else if (expectedTexture === "anim_troll" || expectedTexture === "unit_troll") displaySize = 128;
            else if (expectedTexture === "peasant_unit" || expectedTexture === "builder_unit" || expectedTexture === "unit_vagrant") {
              displaySize = 56;
            }
            else if (expectedTexture === "anim_goblin" || expectedTexture === "anim_cultist") displaySize = 80;
            else if (expectedTexture === "unit_aether_slime") displaySize = 36;
            sprite.setDisplaySize(displaySize, displaySize);
            if (expectedTexture.startsWith("anim_") && scene.anims.exists(`${expectedTexture}_idle`)) {
              sprite.anims.play(`${expectedTexture}_idle`);
            }
          }
        }

        // ── Animation playback ─────────────────────────────────────────────────
        if (!isDead && sprite.texture.key.startsWith("anim_")) {
          const combatType = hasComponent(world, CombatTypeComponent, eid)
            ? CombatTypeComponent.type[eid] : 0;
          const isFlying = hasComponent(world, CanReachElevated, eid);
          const isPlayer = hasComponent(world, PlayerControlled, eid);
          const base = isPlayer
            ? "anim_commander"
            : getAnimBaseKey(faction, combatType, isFlying);
          const targetAnim = isMoving ? `${base}_walk` : `${base}_idle`;

          if (sprite.anims.currentAnim?.key !== targetAnim && scene.anims.exists(targetAnim)) {
            sprite.anims.play(targetAnim);
          }
        }

        // ── FlipX: mirror sprite to face movement direction ────────────────────
        // All spritesheets (heroes & monsters) are normalized to face RIGHT by default.
        // Moving Left (velX < 0) flips the sprite to face left.
        // Moving Right (velX > 0) keeps standard right-facing.
        if (Math.abs(velX) > 5) {
          sprite.setFlipX(velX < 0);
        }

        // Sprint dust particle
        if (Math.abs(Velocity.x[eid]) > 250 && Math.random() < 0.2) {
            const dust = scene.add.rectangle(Position.x[eid], Position.y[eid] + 16, 4, 4, 0xDDDDDD);
            scene.tweens.add({
                targets: dust,
                y: '-=10',
                alpha: 0,
                duration: 400,
                onComplete: () => dust.destroy()
            });
        }

        // ── Synchronize position ───────────────────────────────────────────────
        sprite.setPosition(Position.x[eid], Position.y[eid]);

        // ── Dead entity fadeout ────────────────────────────────────────────────
        if (isDead) {
          sprite.setAlpha(Math.max(0, sprite.alpha - 0.05));
          if (hpGraphics) hpGraphics.clear();
          continue;
        }

        // ── Dynamic HP Bar ─────────────────────────────────────────────────────
        if (hpGraphics) {
          hpGraphics.clear();
          const hp = Health.current[eid];
          const maxHp = Health.max[eid];
          if (hp < maxHp && hp > 0) {
            const barW = 32;
            const barH = 4;
            const barX = Position.x[eid] - barW / 2;
            const barY = Position.y[eid] - 38;
            hpGraphics.fillStyle(0x222222, 0.8);
            hpGraphics.fillRect(barX, barY, barW, barH);
            const fillRatio = Math.max(0, hp / maxHp);
            const color = faction === FactionValues.Hero ? 0x44ff44 : 0xff4444;
            hpGraphics.fillStyle(color, 1.0);
            hpGraphics.fillRect(barX, barY, barW * fillRatio, barH);
          }
        }
      }
    }

    const unitsExited = unitQueryExit(world);
    for (let i = 0; i < unitsExited.length; i++) {
      const eid = unitsExited[i];
      const sprite = spriteMap.get(eid);
      if (sprite) {
        sprite.destroy();
        spriteMap.delete(eid);
      }

      const hpGraphics = unitHpGraphicsMap.get(eid);
      if (hpGraphics) {
        hpGraphics.destroy();
        unitHpGraphicsMap.delete(eid);
      }
    }

    // 2. Camp Core (Grand Nordic Castle Keep & Great Hall)
    const coresEntered = campCoreQueryEnter(world);
    for (let i = 0; i < coresEntered.length; i++) {
      const eid = coresEntered[i];
      const coreTexture = "grand_castle_keep";
      const sprite = scene.add.sprite(Position.x[eid], 650, coreTexture);
      sprite.setDisplaySize(240, 160);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(1);
      spriteMap.set(eid, sprite);
    }
    const cores = campCoreQuery(world);
    for (let i = 0; i < cores.length; i++) {
      const eid = cores[i];
      const sprite = spriteMap.get(eid);
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], 650);
        const time = scene.time.now;

        // Hearth Smoke / Spark Particles
        if (Math.random() < 0.15) {
            const spark = scene.add.circle(Position.x[eid] + (Math.random() * 30 - 15), Position.y[eid] - 20, 2, 0xffea00);
            spark.setAlpha(0.8);
            scene.tweens.add({
                targets: spark,
                y: '-=35',
                x: `+=${Math.random() * 20 - 10}`,
                alpha: 0,
                scale: 1.5,
                duration: 1200,
                onComplete: () => spark.destroy()
            });
        }

        // Diegetic Visuals — smooth steady luminescence based on energy ratio
        const energyRatio = Math.max(0, Math.min(1, CampCoreComponent.lightEnergy[eid] / CampCoreComponent.maxEnergy[eid]));
        const glowAlpha = 0.92 + 0.08 * Math.sin(time / 1200);
        sprite.setAlpha(glowAlpha);

        if (energyRatio > 0.4) {
            sprite.clearTint();
        } else if (energyRatio > 0.1) {
            sprite.setTint(0xffd080); // Warm ember
        } else {
            sprite.setTint(0xff8866); // Soft dimmed amber (steady, no strobe flashing or blinking)
        }
      }
    }

    // 3. Camp Walls
    const wallsEntered = campWallQueryEnter(world);
    for (let i = 0; i < wallsEntered.length; i++) {
      const eid = wallsEntered[i];
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "wall_stage_1_pristine");
      sprite.setOrigin(0.5, 1);
      spriteMap.set(eid, sprite);
    }
    const walls = campWallQuery(world);
    for (let i = 0; i < walls.length; i++) {
      const eid = walls[i];
      const sprite = spriteMap.get(eid);

      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], Position.y[eid]);
        const currentHp = Health.current[eid];
        const maxHp = Health.max[eid];

        if (currentHp <= 0) {
            sprite.setTexture("wall_rubble_collapsed");
            sprite.setAlpha(0.8);
            sprite.clearTint();
        } else {
            const tier = CampWallComponent.tier[eid] || WallTierValues.PalisadeWood;
            if (tier === WallTierValues.PalisadeWood) {
                sprite.setTexture("wall_wood_palisade");
            } else if (tier === WallTierValues.IronSpikes) {
                sprite.setTexture("wall_iron_spikes");
            } else {
                const stage = getWallDamageStage(currentHp, maxHp);
                let textureKey = "wall_stage_1_pristine";
                if (stage === 1) textureKey = "wall_stage_1_pristine";
                else if (stage === 2) textureKey = "wall_stage_2_cracked";
                else if (stage === 3) textureKey = "wall_stage_3_crumbling";
                else if (stage === 4) textureKey = "wall_stage_4_critical";

                sprite.setTexture(textureKey);
            }
            sprite.setAlpha(1.0);
            sprite.clearTint();
        }
      }
    }

    // --- Watchtowers ---
    const watchtowersEntered = watchtowerQueryEnter(world);
    for (let i = 0; i < watchtowersEntered.length; i++) {
      const eid = watchtowersEntered[i];
      const tier = WatchtowerComponent.tier[eid];
      const state = WatchtowerComponent.state[eid];
      let tex = "tower_boulder_pile";
      if (state === TowerStateValues.RUBBLE || tier === TowerTierValues.RUBBLE) tex = "tower_boulder_pile";
      else if (tier === TowerTierValues.WOODEN) tex = "watchtower_tier_1";
      else if (tier === TowerTierValues.BASTION) tex = "watchtower_tier_2";
      else if (tier === TowerTierValues.FORTRESS) tex = "watchtower_tier_3";

      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], tex);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(12);
      spriteMap.set(eid, sprite);
    }
    const watchtowersExit = watchtowerQueryExit(world);
    for (let i = 0; i < watchtowersExit.length; i++) {
      const eid = watchtowersExit[i];
      const sprite = spriteMap.get(eid);
      if (sprite) {
        sprite.destroy();
        spriteMap.delete(eid);
      }
    }
    const watchtowers = watchtowerQuery(world);
    for (let i = 0; i < watchtowers.length; i++) {
      const eid = watchtowers[i];
      const sprite = spriteMap.get(eid);
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], Position.y[eid]);
        const tier = WatchtowerComponent.tier[eid];
        const state = WatchtowerComponent.state[eid];

        let tex = "tower_boulder_pile";
        if (state === TowerStateValues.RUBBLE || tier === TowerTierValues.RUBBLE) tex = "tower_boulder_pile";
        else if (tier === TowerTierValues.WOODEN) tex = "watchtower_tier_1";
        else if (tier === TowerTierValues.BASTION) tex = "watchtower_tier_2";
        else if (tier === TowerTierValues.FORTRESS) tex = "watchtower_tier_3";

        if (sprite.texture.key !== tex && scene.textures.exists(tex)) {
          sprite.setTexture(tex);
        }
      }
    }

    // 4. Spires
    const spiresEntered = spireQueryEnter(world);
    for (let i = 0; i < spiresEntered.length; i++) {
      const eid = spiresEntered[i];
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "spire_dark_crystal");
      spriteMap.set(eid, sprite);
    }
    const spires = spireQuery(world);
    for (let i = 0; i < spires.length; i++) {
      const eid = spires[i];
      const sprite = spriteMap.get(eid);
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        if (Health.current[eid] <= 0) {
          sprite.setAlpha(0.2);
        } else {
          const floorCount = SpireComponent.floorCount[eid];
          sprite.setPosition(Position.x[eid], Position.y[eid] - floorCount * 50 - 24);
          const time = scene.time.now;
          sprite.setAlpha(0.8 + Math.sin(time / 150) * 0.2);
        }
      }
    }

    // --- 4.5. Wall Blueprints ---
    const blueprintsEntered = wallBlueprintQueryEnter(world);
    for (let i = 0; i < blueprintsEntered.length; i++) {
        const eid = blueprintsEntered[i];
        const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "wall_foundation_mound");
        sprite.setOrigin(0.5, 1);
        spriteMap.set(eid, sprite);
    }
    const blueprintsExit = wallBlueprintQueryExit(world);
    for (let i = 0; i < blueprintsExit.length; i++) {
        const eid = blueprintsExit[i];
        const sprite = spriteMap.get(eid);
        if (sprite) {
            sprite.destroy();
            spriteMap.delete(eid);
        }
    }
    const blueprints = wallBlueprintQuery(world);
    for (let i = 0; i < blueprints.length; i++) {
        const eid = blueprints[i];
        const sprite = spriteMap.get(eid);
        if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
            const state = WallBlueprint.state[eid];
            if (state === BlueprintStateValues.MOUND) {
                if (sprite.texture.key !== "wall_foundation_mound") sprite.setTexture("wall_foundation_mound");
            } else if (state === BlueprintStateValues.ORDERED || state === BlueprintStateValues.BUILDING) {
                // Keep mound for now, maybe add particle effects in the future
                if (sprite.texture.key !== "wall_foundation_mound") sprite.setTexture("wall_foundation_mound");
            } else if (state === BlueprintStateValues.COMPLETED) {
                // The blueprint entity should probably be removed when completed, or we change its texture to clear
                sprite.setVisible(false);
            }
        }
    }

    // --- 4.6. POIs (Grand Stands & Workshops) ---
    const poisEntered = poiQueryEnter(world);
    for (let i = 0; i < poisEntered.length; i++) {
        const eid = poisEntered[i];
        const type = WildernessPoiComponent.poiType[eid];
        let texture = "grand_castle_keep"; // fallback
        let dw = 96;
        let dh = 96;
        if (type === 3) { texture = "poi_vagrant_portal"; dw = 64; dh = 64; }
        else if (type === 4) { texture = "tool_hammer_stand"; dw = 96; dh = 96; }
        else if (type === 5) { texture = "tool_bow_stand"; dw = 96; dh = 96; }
        else if (type === 6) { texture = "tool_sword_stand"; dw = 96; dh = 96; }
        else if (type === 8) { texture = "tool_warehouse"; dw = 112; dh = 96; }

        const sprite = scene.add.sprite(Position.x[eid], 650, texture);
        sprite.setOrigin(0.5, 1);
        sprite.setDisplaySize(dw, dh);
        sprite.setDepth(2);
        spriteMap.set(eid, sprite);
    }

    // --- Interactive Floating Prompt ---
    let promptShown = false;
    const players = playerQuery(world);
    if (players.length > 0) {
      const pX = Position.x[players[0]];

      // 1. Check Wall Blueprints (Mounds)
      for (let i = 0; i < blueprints.length; i++) {
        const bpEid = blueprints[i];
        if (WallBlueprint.state[bpEid] === BlueprintStateValues.MOUND) {
          const dist = Math.abs(Position.x[bpEid] - pX);
          if (dist < 65) {
            promptText.setText("[SPACE] Build Wall (10 Aether)")
              .setPosition(Position.x[bpEid], 560)
              .setVisible(true);
            promptShown = true;
            break;
          }
        }
      }

      // 2. Check Tool Stands / POIs
      if (!promptShown) {
        const pois = poiQuery(world);
        for (let i = 0; i < pois.length; i++) {
          const poiEid = pois[i];
          const dist = Math.abs(Position.x[poiEid] - pX);
          if (dist < 65) {
            const type = WildernessPoiComponent.poiType[poiEid];
            let label = "";
            if (type === 3) label = "[SPACE] Guide Vagrant to Camp (5 Aether)";
            else if (type === 4) label = "[SPACE] Hire Builder (10 Aether)";
            else if (type === 5) label = "[SPACE] Hire Archer (15 Aether)";
            else if (type === 6) label = "[SPACE] Hire Knight (20 Aether)";
            else if (type === 8) {
              const cores = campCoreQuery(world);
              const currentLevel = cores.length > 0 && hasComponent(world, CampStockComponent, cores[0])
                ? CampStockComponent.inventoryLevel[cores[0]]
                : 0;
              const cost = computeInventoryUpgradeCost(currentLevel);
              if (cost) {
                label = `[SPACE] Expand Stockpile (${cost.woodCost} Wood ➔ Max ${cost.newMaxWood})`;
              } else {
                label = `Max Stockpile Reached (Lv. ${currentLevel})`;
              }
            }

            if (label) {
              promptText.setText(label)
                .setPosition(Position.x[poiEid], 535)
                .setVisible(true);
              promptShown = true;
              break;
            }
          }
        }
      }

      // 3. Check Watchtowers
      if (!promptShown) {
        for (let i = 0; i < watchtowers.length; i++) {
          const tEid = watchtowers[i];
          const dist = Math.abs(Position.x[tEid] - pX);
          if (dist < 65) {
            const state = WatchtowerComponent.state[tEid];
            const tier = WatchtowerComponent.tier[tEid];
            const garrison = WatchtowerComponent.garrisonCount[tEid];
            const maxG = WatchtowerComponent.maxGarrison[tEid];
            let label = "";

            if (state === TowerStateValues.RUBBLE || tier === TowerTierValues.RUBBLE) {
              const cost = computeTowerUpgradeCost(0)!;
              label = `[SPACE] Build Watchtower (${cost.aether} Aether, ${cost.wood} Wood)`;
            } else if (state === TowerStateValues.ORDERED || state === TowerStateValues.BUILDING) {
              label = `Building Watchtower (${Math.floor(WatchtowerComponent.progress[tEid])}%)`;
            } else if (state === TowerStateValues.COMPLETED) {
              if (garrison < maxG) {
                label = `[SPACE] Station Archer (${garrison}/${maxG})`;
              } else {
                const cost = computeTowerUpgradeCost(tier);
                if (cost) {
                  const ironStr = cost.iron > 0 ? `, ${cost.iron} Iron` : "";
                  const tierName = cost.nextTier === 2 ? "Bastion" : "Fortress";
                  label = `[SPACE] Upgrade ${tierName} (${cost.aether} Aether, ${cost.wood} Wood${ironStr})`;
                } else {
                  label = `Fortress Watchtower (Max Lv. 3 - ${garrison}/${maxG} Archers)`;
                }
              }
            }

            if (label) {
              promptText.setText(label)
                .setPosition(Position.x[tEid], Position.y[tEid] - 50)
                .setVisible(true);
              promptShown = true;
              break;
            }
          }
        }
      }
    }

    if (!promptShown) {
      promptText.setVisible(false);
    }

    // --- Harvestable Nodes ---
    const harvestableEnter = harvestableQueryEnter(world);
    for (let i = 0; i < harvestableEnter.length; i++) {
        const eid = harvestableEnter[i];
        const type = HarvestableNode.nodeType[eid];
        let textureId = "tree_ancient_oak";
        if (type === HarvestableNodeValues.IronOre) textureId = "node_iron_ore";
        else if (type === HarvestableNodeValues.TallPine) textureId = "tree_tall_pine";
        else if (type === HarvestableNodeValues.AutumnBirch) textureId = "tree_autumn_birch";
        else if (type === HarvestableNodeValues.PineTree || type === HarvestableNodeValues.AncientOak) textureId = "tree_ancient_oak";

        const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], textureId);
        sprite.setOrigin(0.5, 1.0); // Grounded
        sprite.setDepth(5); // In background behind units
        spriteMap.set(eid, sprite);
    }

    const harvestableEids = harvestableQuery(world);
    for (let i = 0; i < harvestableEids.length; i++) {
        const eid = harvestableEids[i];
        const sprite = spriteMap.get(eid) as Phaser.GameObjects.Sprite;
        if (sprite) {
            sprite.x = Position.x[eid];
            sprite.y = Position.y[eid];
            const state = HarvestableNode.state[eid];
            if (state === HarvestableStateValues.Depleted) {
                sprite.setAlpha(0.3);
            } else if (state === HarvestableStateValues.Ordered || state === HarvestableStateValues.BeingHarvested) {
                sprite.setAlpha(0.8);
            } else {
                sprite.setAlpha(1.0);
            }
        }
    }

    const harvestableExit = harvestableQueryExit(world);
    for (let i = 0; i < harvestableExit.length; i++) {
        const eid = harvestableExit[i];
        const sprite = spriteMap.get(eid);
        if (sprite) {
            sprite.destroy();
            spriteMap.delete(eid);
        }
    }

    // --- Motes ---
    const motesEntered = moteQueryEnter(world);
    for (let i = 0; i < motesEntered.length; i++) {
        const eid = motesEntered[i];
        // Bobbing glowing mote
        const sprite = scene.add.circle(Position.x[eid], Position.y[eid], 4, 0x00ffff, 0.8);
        spriteMap.set(eid, sprite);

        // Add a gentle floating tween
        scene.tweens.add({
            targets: sprite,
            y: '-=10',
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    const motes = moteQuery(world);
    for (let i = 0; i < motes.length; i++) {
        const eid = motes[i];
        const sprite = spriteMap.get(eid);
        if (sprite && sprite instanceof Phaser.GameObjects.Arc) {
            // we override tweens if position changes drastically (magnet pull)
            // but for simple bob we might just apply position and let tween add offset if we wanted to be perfectly precise.
            // For now just set x, y will be manipulated by tween mostly but we update it if it's pulled.
            // To allow tween + magnetic pull to co-exist cleanly, we can just sync X and let tween handle Y local offset,
            // or just set position directly.
            sprite.x = Position.x[eid];
            if (Math.abs(sprite.y - Position.y[eid]) > 15) {
                sprite.y = Position.y[eid];
            }

            const lifetime = AetherMoteComponent.lifetime[eid];
            if (lifetime !== undefined && lifetime > 0 && lifetime < 5000) {
                const flicker = Math.sin(scene.time.now / 60) > 0 ? 0.95 : 0.15;
                sprite.setAlpha(flicker);
            } else {
                sprite.setAlpha(0.85);
            }
        }
    }
    const motesExited = moteQueryExit(world);
    for (let i = 0; i < motesExited.length; i++) {
        const eid = motesExited[i];
        const sprite = spriteMap.get(eid);
        if (sprite) {
            sprite.destroy();
            spriteMap.delete(eid);
        }
    }

    // --- Aether Collect Events ---
    const collectEvents = aetherCollectEventQuery(world);
    for (let i = 0; i < collectEvents.length; i++) {
        const eid = collectEvents[i];
        const tx = AetherCollectEvent.x[eid];
        const ty = AetherCollectEvent.y[eid];

        // Golden sparkle burst
        for (let p = 0; p < 5; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 30 + 10;
            const flare = scene.add.circle(tx, ty, 2, 0xffea55, 1);
            scene.tweens.add({
                targets: flare,
                x: tx + Math.cos(angle) * speed,
                y: ty + Math.sin(angle) * speed,
                alpha: 0,
                duration: 500,
                onComplete: () => flare.destroy()
            });
        }

        removeEntity(world, eid);
    }

    // --- 4.7 Level Up Events ---
    const levelUpEvents = levelUpEventQuery(world);
    for (let i = 0; i < levelUpEvents.length; i++) {
        const eventEid = levelUpEvents[i];
        const tx = LevelUpEvent.targetX[eventEid];
        const ty = LevelUpEvent.targetY[eventEid];
        const level = LevelUpEvent.level[eventEid];

        // Spawn text
        const text = scene.add.text(tx, ty, `★ LVL ${level}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffea55',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5, 0.5);

        scene.tweens.add({
            targets: text,
            y: ty - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        // Golden particle burst using circle tweens
        for(let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 20 + 10;
            const flare = scene.add.circle(tx, ty + 20, 2, 0xffea55, 1);
            scene.tweens.add({
                targets: flare,
                x: tx + Math.cos(angle) * speed,
                y: ty + 20 + Math.sin(angle) * speed,
                alpha: 0,
                duration: 600,
                onComplete: () => flare.destroy()
            });
        }

        removeEntity(world, eventEid);
    }

    // 5. Floors
    const floorsEntered = floorQueryEnter(world);
    for (let i = 0; i < floorsEntered.length; i++) {
      const eid = floorsEntered[i];
      const container = scene.add.container(Position.x[eid], Position.y[eid]);

      const isGroundFloor = FloorComponent.floorIndex[eid] === 1;
      const wallTexture = isGroundFloor ? "spire_archway_wall" : "spire_cutaway_wall";

      const wall = scene.add.sprite(0, -60, wallTexture);
      const platform = scene.add.sprite(0, 0, "spire_floor_platform");
      const barricade = scene.add.sprite(0, -32, "spire_barricade_gate");

      container.add([wall, platform, barricade]);
      spriteMap.set(eid, container);
    }
    const floors = floorQuery(world);
    for (let i = 0; i < floors.length; i++) {
      const eid = floors[i];
      const container = spriteMap.get(eid);
      if (container && container instanceof Phaser.GameObjects.Container) {
        container.setPosition(Position.x[eid], Position.y[eid]);
        if (FloorComponent.cleared[eid] === 1) {
            container.setAlpha(0.3);
            container.each((child: any) => child.setTint(0x555555));
        } else {
            container.setAlpha(1.0);
            container.each((child: any) => child.clearTint());
        }
      }
    }

    // 6. Game State
    const states = stateQuery(world);
    if (states.length > 0) {
        const stateEid = states[0];
        const state = GameStateComponent.state[stateEid];

        if (state === GameStateValues.VICTORY) {
            if (!victoryBanner) {
                victoryBanner = scene.add.text(400, 200, "VICTORY!", { fontSize: '64px', color: '#00ff00' }).setOrigin(0.5);
            }
        } else if (state === GameStateValues.DEFEAT) {
            if (!defeatBanner) {
                defeatBanner = scene.add.text(400, 200, "DEFEAT - THE COMMANDER HAS FALLEN", { fontSize: '64px', color: '#ff0000' }).setOrigin(0.5);
            }
        }
    }

    // 7. Ambient Lighting
    const cycleEids = dayNightQuery(world);
    if (cycleEids.length > 0) {
        const eid = cycleEids[0];
        const time = DayNightCycle.timeOfDay[eid];
        // Cycle is 45000 day + 30000 night = 75000 total
        const cycleProgress = (time % 75000) / 75000;
        const color = getAmbientLightingColor(cycleProgress);

        // Ensure integer values
        const r = Math.floor(color.r);
        const g = Math.floor(color.g);
        const b = Math.floor(color.b);
        const hexColor = (r << 16) + (g << 8) + b;

        ambientRect.setFillStyle(hexColor, color.alpha);
    }

    return world;
  };
}
