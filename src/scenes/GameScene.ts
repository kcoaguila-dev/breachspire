import { createDayNightSystem } from "../ecs/systems/DayNightSystem";
import Phaser from "phaser";
import { world, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, createGameStateEntity, createInvasionSpawner, setPlayerControlled, createDayNightEntity } from "../ecs/world";
import { SpireSideValues } from "../ecs/components";
import { createFSMSystem } from "../ecs/systems/FSMSystem";
import { createPlayerInputSystem } from "../ecs/systems/PlayerInputSystem";
import { createSplitCameraSystem } from "../ecs/systems/SplitCameraSystem";
import { createCoopSystem } from "../ecs/systems/CoopSystem";
import { createClimbingSystem } from "../ecs/systems/ClimbingSystem";
import { CoopStateComponent, WildernessPoiComponent } from "../ecs/components";
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
import { createCommanderSupportSystem } from "../ecs/systems/CommanderSupportSystem";
import { createLeaderDeathSystem } from "../ecs/systems/LeaderDeathSystem";
import { createCombatFeedbackSystem } from "../ecs/systems/CombatFeedbackSystem";
import { AudioManager } from "../audio/AudioManager";
import { loadUnitData, loadCampConfig, loadSpireConfig } from "../data/loader";
import { defineQuery, addEntity, addComponent } from "bitecs";
import { GameStateComponent, DayNightCycle, GameStateValues, CampCoreComponent, ScreenAlertComponent } from "../ecs/components";
import { SpriteMap } from "../ecs/systems/RenderSyncSystem";
import { createHUDSystem } from "../ecs/systems/HUDSystem";
import { createBuildingSystem } from "../ecs/systems/BuildingSystem";
import { createRecruitmentSystem } from "../ecs/systems/RecruitmentSystem";
import { createProgressionXPSystem } from "../ecs/systems/ProgressionXPSystem";
import { loadCampSaveState, saveCampSaveState } from "../persistence/RunStateManager";
import { createAetherSpawningSystem } from "../ecs/systems/AetherSpawningSystem";
import { createAetherCollectionSystem } from "../ecs/systems/AetherCollectionSystem";

export class GameScene extends Phaser.Scene {
  private fsmSystem!: ReturnType<typeof createFSMSystem>;
  private movementSystem!: ReturnType<typeof createMovementSystem>;
  private combatSystem!: ReturnType<typeof createCombatSystem>;
  private leaderDeathSystem!: ReturnType<typeof createLeaderDeathSystem>;
  private deathSystem!: ReturnType<typeof createDeathSystem>;
  private campEnergySystem!: ReturnType<typeof createCampEnergySystem>;
  private commanderSupportSystem!: ReturnType<typeof createCommanderSupportSystem>;
  private spireGrowthSystem!: ReturnType<typeof createSpireGrowthSystem>;
  private renderSyncSystem!: ReturnType<typeof createRenderSyncSystem>;

  private monsterSpawnSystem!: ReturnType<typeof createMonsterSpawnSystem>;
  private dayNightSystem!: ReturnType<typeof createDayNightSystem>;
  private campSiegeSystem!: ReturnType<typeof createCampSiegeSystem>;
  private floorCollapseSystem!: ReturnType<typeof createFloorCollapseSystem>;
  private gameStateSystem!: ReturnType<typeof createGameStateSystem>;
  private playerInputSystem!: ReturnType<typeof createPlayerInputSystem>;
  private splitCameraSystem!: ReturnType<typeof createSplitCameraSystem>;
  private coopSystem!: ReturnType<typeof createCoopSystem>;
  private climbingSystem!: ReturnType<typeof createClimbingSystem>;
  private hudSystem!: ReturnType<typeof createHUDSystem>;
  private combatFeedbackSystem!: ReturnType<typeof createCombatFeedbackSystem>;
  private buildingSystem!: ReturnType<typeof createBuildingSystem>;
  private recruitmentSystem!: ReturnType<typeof createRecruitmentSystem>;
  private progressionXPSystem!: ReturnType<typeof createProgressionXPSystem>;
  private aetherSpawningSystem!: ReturnType<typeof createAetherSpawningSystem>;
  private aetherCollectionSystem!: ReturnType<typeof createAetherCollectionSystem>;


  private screenAlertEid!: number;

  private bgMountains!: Phaser.GameObjects.TileSprite;
  private bgTrees!: Phaser.GameObjects.TileSprite;

  private spriteMap: SpriteMap = new Map();

  private isReady = false;
  private isGameOver = false;

  private stateQuery = defineQuery([GameStateComponent]);
  private coreQuery = defineQuery([CampCoreComponent]);
  private dayNightQuery = defineQuery([DayNightCycle]);


  private audioManager!: AudioManager;
  private prevIsNight: number = -1;
constructor() {
    super("GameScene");
  }

  async create() {
    this.fsmSystem = createFSMSystem();
    this.movementSystem = createMovementSystem();
    this.combatSystem = createCombatSystem();
    this.leaderDeathSystem = createLeaderDeathSystem();
    this.deathSystem = createDeathSystem(this.spriteMap);
    this.campEnergySystem = createCampEnergySystem();
    this.commanderSupportSystem = createCommanderSupportSystem();
    this.spireGrowthSystem = createSpireGrowthSystem();
    this.renderSyncSystem = createRenderSyncSystem(this, this.spriteMap);
    this.dayNightSystem = createDayNightSystem(45000, 30000); // 45s day, 30s night

    this.campSiegeSystem = createCampSiegeSystem();
    this.floorCollapseSystem = createFloorCollapseSystem();
    this.gameStateSystem = createGameStateSystem();
    this.hudSystem = createHUDSystem(this);
    this.buildingSystem = createBuildingSystem();
    this.recruitmentSystem = createRecruitmentSystem();
    this.progressionXPSystem = createProgressionXPSystem();

    // Setup Audio and Feedback
    this.audioManager = new AudioManager();

    // Unlock Audio Context and start Day BGM on first interaction
    this.input.once('pointerdown', () => {
      this.audioManager.startBGM();
      this.audioManager.setMusicMood('day', 0); // Start immediately as day
    });

    // Mute key
    const mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    mKey.on('down', () => {
      this.audioManager.toggleMute();
    });

    this.combatFeedbackSystem = createCombatFeedbackSystem(this, this.audioManager);

    // Setup Singleton ScreenAlert
    this.screenAlertEid = addEntity(world);
    addComponent(world, ScreenAlertComponent, this.screenAlertEid);
    ScreenAlertComponent.leftFlankDanger[this.screenAlertEid] = 0;
    ScreenAlertComponent.rightFlankDanger[this.screenAlertEid] = 0;
    ScreenAlertComponent.shakeIntensity[this.screenAlertEid] = 0;

    // Set Map Bounds (3200x1200)
    this.physics?.world.setBounds(0, 0, 3200, 1200); // Optional if physics exists
    this.cameras.main.setBounds(0, 0, 3200, 1200);

    // Setup Inputs
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const numpad0Key = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const f2Key = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    this.playerInputSystem = createPlayerInputSystem(cursors, wasd, spaceKey, numpad0Key, enterKey, shiftKey);
    this.climbingSystem = createClimbingSystem();
    this.splitCameraSystem = createSplitCameraSystem(this);
    this.aetherSpawningSystem = createAetherSpawningSystem();
    this.aetherCollectionSystem = createAetherCollectionSystem(this.audioManager);

    try {
      // Load Data from public directory
      const knightData = await loadUnitData('/data/heroes/commander.json');
      // For P2 we can reuse knightData or load an archer if available. We'll use knightData for now if no archer.
      // But let's check if archer exists. If it fails, fallback to knight.
      let p2Data = knightData;
      try {
        p2Data = await loadUnitData('/data/heroes/archer.json');
      } catch (e) { }

      const goblinData = await loadUnitData('/data/monsters/goblin.json');
      const campConfig = await loadCampConfig('/data/camp/camp_config.json');
      const spireConfig = await loadSpireConfig('/data/spires/spire_config.json');

      let trollData = goblinData;
      let archerData = goblinData;
      let cultistData = goblinData;
      let darkArcherData = goblinData;
      try { trollData = await loadUnitData('/data/monsters/troll.json'); } catch(e) {}
      try { archerData = await loadUnitData('/data/monsters/archer.json'); } catch(e) {}
      try { cultistData = await loadUnitData('/data/monsters/cultist.json'); } catch(e) {}
      try { darkArcherData = await loadUnitData('/data/monsters/dark_archer.json'); } catch(e) {}

      const defendersData = {
        goblin: goblinData,
        troll: trollData,
        dark_archer: darkArcherData,
        cultist: cultistData
      };

      this.monsterSpawnSystem = createMonsterSpawnSystem(goblinData, archerData, trollData); // Actually p2Data might be archer. Let's load archer explicitly for monsters if we can.
      this.coopSystem = createCoopSystem(f2Key, p2Data);

      const centerY = 650;

      // Camp Core at 1600
      const coreX = 1600;

      // Add Parallax Backgrounds
      const sw = this.scale.width;
      // const sh = this.scale.height;
      const worldWidth = 3200;

      this.add.tileSprite(sw / 2, 600, sw, 1200, "bg_sky").setScrollFactor(0).setDepth(-10);
      this.bgMountains = this.add.tileSprite(sw / 2, centerY - 100, sw, 300, "bg_mountains").setScrollFactor(0).setDepth(-9);
      this.bgTrees = this.add.tileSprite(sw / 2, centerY - 40, sw, 200, "bg_trees").setScrollFactor(0).setDepth(-8);
      this.add.tileSprite(worldWidth / 2, centerY + 32, worldWidth, 64, "ground_cobblestone_bank").setScrollFactor(1.0).setDepth(0);

      // Center the camera on the avatar
      this.cameras.main.centerOn(coreX, centerY);

      // Secondary camera for water reflection
      const reflectionCamera = this.cameras.add(0, 650, 3200, 250);
      reflectionCamera.setAlpha(0.35);
      reflectionCamera.setZoom(1, -1);
      reflectionCamera.scrollY = 650;
      // Also match the bounds and zoom of main camera
      reflectionCamera.setBounds(0, 0, 3200, 1200);
      // We will sync scrollX in update()
      this.events.on('update', (time: number) => {
        reflectionCamera.scrollX = this.cameras.main.scrollX;
        // The reflection camera should always focus on the same vertical baseline inverted
        reflectionCamera.scrollY = 650;

        // Add subtle wave ripple offsets
        reflectionCamera.scrollX += Math.sin(time / 500) * 4;
        reflectionCamera.scrollY += Math.cos(time / 400) * 2;
      });

      createGameStateEntity(world);
      createDayNightEntity(world);

      // Coop Entity
      const coopEid = addEntity(world);
      addComponent(world, CoopStateComponent, coopEid);
      CoopStateComponent.isCoopActive[coopEid] = 0;
      CoopStateComponent.player1Eid[coopEid] = -1;
      CoopStateComponent.player2Eid[coopEid] = -1;

      // Spawn Camp
      createCampCoreEntity(world, campConfig, coreX, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Left, 1200, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Right, 2000, centerY);

      // Spawn Spires
      const leftSpire = createSpireEntity(world, spireConfig, SpireSideValues.Left, 200, centerY, defendersData);
      const rightSpire = createSpireEntity(world, spireConfig, SpireSideValues.Right, 3000, centerY, defendersData);

      // Wilderness Shrines
      const leftShrine = addEntity(world);
      addComponent(world, WildernessPoiComponent, leftShrine);
      WildernessPoiComponent.poiType[leftShrine] = 0;
      WildernessPoiComponent.x[leftShrine] = 800;

      const rightShrine = addEntity(world);
      addComponent(world, WildernessPoiComponent, rightShrine);
      WildernessPoiComponent.poiType[rightShrine] = 0;
      WildernessPoiComponent.x[rightShrine] = 2400;

      // Spawn invasion spawners
      createInvasionSpawner(world, leftSpire, SpireSideValues.Left, 3000, 3);
      createInvasionSpawner(world, rightSpire, SpireSideValues.Right, 3000, 3);

      // Spawn units
      const knightEntity = createUnitEntity(world, knightData, coreX, centerY);
      setPlayerControlled(world, knightEntity, 1);
      CoopStateComponent.player1Eid[coopEid] = knightEntity;

      createUnitEntity(world, goblinData, coreX + 200, centerY);

      this.isReady = true;
      console.log("GameScene ready");
    } catch (e) {
      console.error("Failed to load game data:", e);
    }
  }

  update(_time: number, delta: number) {
    if (!this.isReady) return;
    if (this.isGameOver) return;

    // ECS pipeline — order is critical:
    // 1. FSM decides intent
    // 2. Movement applies velocity
    // 3. Combat applies damage
    // 4. Death removes dead entities from world + spriteMap
    // 5. System specific logical updates
    // 6. RenderSync mirrors live ECS state to Phaser (must be last, read-only)

    // Process input first
    this.playerInputSystem(world, delta);

    this.aetherSpawningSystem(world, delta);
    this.aetherCollectionSystem(world, delta);

    // Kingdom Building & Recruitment Systems
    this.buildingSystem(world, delta);
    this.recruitmentSystem(world, delta);
    this.progressionXPSystem(world, delta);

    this.fsmSystem(world, delta);
    this.climbingSystem(world, delta);
    this.movementSystem(world, delta);
    this.combatSystem(world, delta);
    this.campSiegeSystem(world, delta); // M3
    this.leaderDeathSystem(world, delta); // M4 — intercepts leader death before DeathSystem runs
    this.deathSystem(world); // Remove non-leader units/walls if dead

    // M3 logic
    this.dayNightSystem(world, delta);
    this.monsterSpawnSystem(world, delta);
    this.floorCollapseSystem(world, delta);
    this.gameStateSystem(world, delta);

    this.campEnergySystem(world, delta);
    this.commanderSupportSystem(world, delta); // M4
    this.spireGrowthSystem(world, delta);

    // Run feedback system (consumes DamageTextEvents and applies alerts/shake)
    this.combatFeedbackSystem(world, delta);

    // Update camera before render sync
    this.coopSystem(world, delta);
    this.splitCameraSystem(world, delta);

    if (this.bgMountains) this.bgMountains.tilePositionX = this.cameras.main.scrollX * 0.1;
    if (this.bgTrees) this.bgTrees.tilePositionX = this.cameras.main.scrollX * 0.3;

    this.renderSyncSystem(world);
    this.hudSystem(world, delta);

    // Check DayNightCycle to transition BGM
    const dayNightEids = this.dayNightQuery(world);
    if (dayNightEids.length > 0) {
      const eid = dayNightEids[0];
      const isNight = DayNightCycle.isNight[eid];

      if (this.prevIsNight !== isNight) {
        if (this.prevIsNight !== -1) {
          if (isNight === 1) {
            this.audioManager.setMusicMood('night', 3000);
          } else {
            this.audioManager.setMusicMood('day', 3000);
          }
        }
        this.prevIsNight = isNight;
      }
    }


    // Check Win/Loss Condition
    const stateEids = this.stateQuery(world);
    if (stateEids.length > 0) {
      const currentState = GameStateComponent.state[stateEids[0]];
      if (currentState === GameStateValues.VICTORY || currentState === GameStateValues.DEFEAT) {
        this.handleGameOver(currentState === GameStateValues.VICTORY, world);
      }
    }
  }

  private handleGameOver(isVictory: boolean, world: any) {
    this.isGameOver = true;

    if (!isVictory) {
      // Freeze entities (handled by isGameOver = true returning early in update loop)
      // Flash screen red
      this.cameras.main.flash(1000, 255, 0, 0);
      // Play defeat stinger
      this.audioManager.playDefeatStinger();
    } else {
      this.audioManager.playVictoryStinger();
    }

    // Save state
    const saveState = loadCampSaveState();
    saveState.runCount += 1;

    // Calculate earned Aether (for now, simply use whatever is left in CampCore, plus maybe bonus)
    let aetherEarned = 0;
    const cores = this.coreQuery(world);
    if (cores.length > 0) {
      aetherEarned = Math.floor(CampCoreComponent.lightEnergy[cores[0]]);
    }

    // In defeat, retain 50%, in victory, 100%
    const retainedRatio = isVictory ? 1.0 : 0.5;
    const actualSpoils = Math.floor(aetherEarned * retainedRatio);
    saveState.totalAetherEarned += actualSpoils;

    saveCampSaveState(saveState);

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const text = isVictory ? "VICTORY" : "DEFEAT - THE HEARTH HAS FALLEN";
    const color = isVictory ? "#00ff00" : "#ff0000";

    const titleText = this.add.text(centerX, centerY - 50, text, {
      fontSize: "64px",
      color: color,
      fontStyle: "bold"
    }).setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(1000);

    const descText = this.add.text(centerX, centerY + 20, `Spoils Retained: ${actualSpoils}`, {
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);
    descText.setScrollFactor(0);
    descText.setDepth(1000);

    this.time.delayedCall(3000, () => {
      this.scene.start("TitleScene");
    });
  }
}
