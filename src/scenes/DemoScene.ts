import Phaser from "phaser";
import { world, createUnitEntity } from "../ecs/world";
import { createFSMSystem } from "../ecs/systems/FSMSystem";
import { createCombatSystem } from "../ecs/systems/CombatSystem";
import { createRenderSyncSystem } from "../ecs/systems/RenderSyncSystem";
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import { createDeathSystem } from "../ecs/systems/DeathSystem";
import { loadUnitData } from "../data/loader";

export class DemoScene extends Phaser.Scene {
  private fsmSystem!: ReturnType<typeof createFSMSystem>;
  private movementSystem!: ReturnType<typeof createMovementSystem>;
  private combatSystem!: ReturnType<typeof createCombatSystem>;
  private deathSystem!: ReturnType<typeof createDeathSystem>;
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
    this.renderSyncSystem = createRenderSyncSystem(this, this.spriteMap);

    try {
      // Load Data from public directory
      const knightData = await loadUnitData('/data/heroes/knight.json');
      const goblinData = await loadUnitData('/data/monsters/goblin.json');

      // Spawn entities
      createUnitEntity(world, knightData, 100, 300);
      createUnitEntity(world, goblinData, 700, 300);

      this.isReady = true;
      console.log("DemoScene ready");
    } catch (e) {
      console.error("Failed to load unit data:", e);
    }
  }

  update(_time: number, delta: number) {
    if (!this.isReady) return;

    // ECS pipeline — order is critical:
    // 1. FSM decides intent
    // 2. Movement applies velocity
    // 3. Combat applies damage
    // 4. Death removes dead entities from world + spriteMap
    // 5. RenderSync mirrors live ECS state to Phaser (must be last, read-only)
    this.fsmSystem(world, delta);
    this.movementSystem(world, delta);
    this.combatSystem(world, delta);
    this.deathSystem(world);
    this.renderSyncSystem(world);
  }
}