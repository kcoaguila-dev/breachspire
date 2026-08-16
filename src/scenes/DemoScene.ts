import Phaser from "phaser";
import { world, createUnitEntity } from "../ecs/world";
import { createFSMSystem } from "../ecs/systems/FSMSystem";
import { createCombatSystem } from "../ecs/systems/CombatSystem";
import { createRenderSyncSystem } from "../ecs/systems/RenderSyncSystem";
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import { loadUnitData } from "../data/loader";

export class DemoScene extends Phaser.Scene {
  private fsmSystem!: ReturnType<typeof createFSMSystem>;
  private movementSystem!: ReturnType<typeof createMovementSystem>;
  private combatSystem!: ReturnType<typeof createCombatSystem>;
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

    // Run ECS pipeline
    this.fsmSystem(world, delta);
    this.movementSystem(world, delta);
    this.combatSystem(world, delta);
    this.renderSyncSystem(world);
  }
}