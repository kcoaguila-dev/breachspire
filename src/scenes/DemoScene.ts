import Phaser from "phaser";
import { world, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, createGameStateEntity, createInvasionSpawner, setPlayerControlled } from "../ecs/world";
import { SpireSideValues } from "../ecs/components";
import { createFSMSystem } from "../ecs/systems/FSMSystem";
import { createPlayerInputSystem } from "../ecs/systems/PlayerInputSystem";
import { createCameraFollowSystem } from "../ecs/systems/CameraFollowSystem";
import { createCombatSystem } from "../ecs/systems/CombatSystem";
import { createRenderSyncSystem } from "../ecs/systems/RenderSyncSystem";
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import { createDeathSystem } from "../ecs/systems/DeathSystem";
import { createCampEnergySystem } from "../ecs/systems/CampEnergySystem";
import { createSpireGrowthSystem } from "../ecs/systems/SpireGrowthSystem";
import { createMonsterSpawnSystem } from "../ecs/systems/MonsterSpawnSystem";
import { createCampSiegeSystem } from "../ecs/systems/CampSiegeSystem";
import { createFloorCollapseSystem } from "../ecs/systems/FloorCollapseSystem";
import { createGameStateSystem } from "../ecs/systems/GameStateSystem";
import { loadUnitData, loadCampConfig, loadSpireConfig } from "../data/loader";

export class DemoScene extends Phaser.Scene {
  private fsmSystem!: ReturnType<typeof createFSMSystem>;
  private movementSystem!: ReturnType<typeof createMovementSystem>;
  private combatSystem!: ReturnType<typeof createCombatSystem>;
  private deathSystem!: ReturnType<typeof createDeathSystem>;
  private campEnergySystem!: ReturnType<typeof createCampEnergySystem>;
  private spireGrowthSystem!: ReturnType<typeof createSpireGrowthSystem>;
  private renderSyncSystem!: ReturnType<typeof createRenderSyncSystem>;

  private monsterSpawnSystem!: ReturnType<typeof createMonsterSpawnSystem>;
  private campSiegeSystem!: ReturnType<typeof createCampSiegeSystem>;
  private floorCollapseSystem!: ReturnType<typeof createFloorCollapseSystem>;
  private gameStateSystem!: ReturnType<typeof createGameStateSystem>;
  private playerInputSystem!: ReturnType<typeof createPlayerInputSystem>;
  private cameraFollowSystem!: ReturnType<typeof createCameraFollowSystem>;

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

    this.campSiegeSystem = createCampSiegeSystem();
    this.floorCollapseSystem = createFloorCollapseSystem();
    this.gameStateSystem = createGameStateSystem();

    // Setup Inputs
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.playerInputSystem = createPlayerInputSystem(cursors, wasd, spaceKey);
    this.cameraFollowSystem = createCameraFollowSystem(this);

    try {
      // Load Data from public directory
      const knightData = await loadUnitData('/data/heroes/knight.json');
      const goblinData = await loadUnitData('/data/monsters/goblin.json');
      const campConfig = await loadCampConfig('/data/camp/camp_config.json');
      const spireConfig = await loadSpireConfig('/data/spires/spire_config.json');

      this.monsterSpawnSystem = createMonsterSpawnSystem(goblinData);

      const centerY = 500;
      const centerX = 400;

      createGameStateEntity(world);

      // Spawn Camp
      createCampCoreEntity(world, campConfig, centerX, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Left, centerX - 100, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Right, centerX + 100, centerY);

      // Spawn Spires
      const leftSpire = createSpireEntity(world, spireConfig, SpireSideValues.Left, centerX - 300, centerY);
      const rightSpire = createSpireEntity(world, spireConfig, SpireSideValues.Right, centerX + 300, centerY);

      // Spawn invasion spawners
      createInvasionSpawner(world, leftSpire, SpireSideValues.Left, 3000, 3);
      createInvasionSpawner(world, rightSpire, SpireSideValues.Right, 3000, 3);

      // Spawn units
      const knightEntity = createUnitEntity(world, knightData, centerX - 50, centerY);
      setPlayerControlled(world, knightEntity);

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

    // Process input first
    this.playerInputSystem(world, delta);

    this.fsmSystem(world, delta);
    this.movementSystem(world, delta);
    this.combatSystem(world, delta);
    this.campSiegeSystem(world, delta); // M3
    this.deathSystem(world); // Remove units/walls if dead

    // M3 logic
    this.monsterSpawnSystem(world, delta);
    this.floorCollapseSystem(world, delta);
    this.gameStateSystem(world, delta);

    this.campEnergySystem(world, delta);
    this.spireGrowthSystem(world, delta);

    // Update camera before render sync
    this.cameraFollowSystem(world, delta);

    this.renderSyncSystem(world);
  }
}
