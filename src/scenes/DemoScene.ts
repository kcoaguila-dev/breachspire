import Phaser from "phaser";
import { world, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity } from "../ecs/world";
import { SpireSideValues } from "../ecs/components";
import { createFSMSystem } from "../ecs/systems/FSMSystem";
import { createCombatSystem } from "../ecs/systems/CombatSystem";
import { createRenderSyncSystem } from "../ecs/systems/RenderSyncSystem";
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import { createDeathSystem } from "../ecs/systems/DeathSystem";
import { createCampEnergySystem } from "../ecs/systems/CampEnergySystem";
import { createSpireGrowthSystem } from "../ecs/systems/SpireGrowthSystem";
import { loadUnitData, loadCampConfig, loadSpireConfig } from "../data/loader";

export class DemoScene extends Phaser.Scene {
  private fsmSystem!: ReturnType<typeof createFSMSystem>;
  private movementSystem!: ReturnType<typeof createMovementSystem>;
  private combatSystem!: ReturnType<typeof createCombatSystem>;
  private deathSystem!: ReturnType<typeof createDeathSystem>;
  private campEnergySystem!: ReturnType<typeof createCampEnergySystem>;
  private spireGrowthSystem!: ReturnType<typeof createSpireGrowthSystem>;
  private renderSyncSystem!: ReturnType<typeof createRenderSyncSystem>;

  private spriteMap = new Map<number, Phaser.GameObjects.Rectangle>();

  private isReady = false;

  constructor() {
    super("DemoScene");
  }

  async create() {
    this.fsmSystem = createFSMSystem();
    this.movementSystem = createMovementSystem();
    this.combatSystem = createCombatSystem();
    this.deathSystem = createDeathSystem(this.spriteMap);
    this.campEnergySystem = createCampEnergySystem();
    this.spireGrowthSystem = createSpireGrowthSystem();
    this.renderSyncSystem = createRenderSyncSystem(this, this.spriteMap);

    try {
      // Load Data from public directory
      const knightData = await loadUnitData('/data/heroes/knight.json');
      const goblinData = await loadUnitData('/data/monsters/goblin.json');
      const campConfig = await loadCampConfig('/data/camp/camp_config.json');
      const spireConfig = await loadSpireConfig('/data/spires/spire_config.json');

      const centerY = 500;
      const centerX = 400;

      // Spawn Camp
      createCampCoreEntity(world, campConfig, centerX, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Left, centerX - 100, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Right, centerX + 100, centerY);

      // Spawn Spires
      createSpireEntity(world, spireConfig, SpireSideValues.Left, centerX - 300, centerY);
      createSpireEntity(world, spireConfig, SpireSideValues.Right, centerX + 300, centerY);

      // Spawn units
      createUnitEntity(world, knightData, centerX - 50, centerY);
      createUnitEntity(world, goblinData, centerX + 200, centerY);

      this.isReady = true;
      console.log("DemoScene ready");
    } catch (e) {
      console.error("Failed to load game data:", e);
    }
  }

  update(_time: number, delta: number) {
    if (!this.isReady) return;

    // ECS pipeline — order is critical:
    // 1. FSM decides intent
    // 2. Movement applies velocity
    // 3. Combat applies damage
    // 4. Death removes dead entities from world + spriteMap
    // 5. System specific logical updates
    // 6. RenderSync mirrors live ECS state to Phaser (must be last, read-only)
    this.fsmSystem(world, delta);
    this.movementSystem(world, delta);
    this.combatSystem(world, delta);
    this.deathSystem(world);
    this.campEnergySystem(world, delta);
    this.spireGrowthSystem(world, delta);
    this.renderSyncSystem(world);
  }
}
