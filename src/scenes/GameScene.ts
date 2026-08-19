import { createDayNightSystem } from "../ecs/systems/DayNightSystem";
import Phaser from "phaser";
import { world, createUnitEntity, createCampCoreEntity, createCampWallEntity, createSpireEntity, createGameStateEntity, createInvasionSpawner, setPlayerControlled, createDayNightEntity } from "../ecs/world";
import { SpireSideValues, Position, Velocity, Speed, Health, FactionTag, FactionValues, UnitRole, RoleValues, WallBlueprint, BlueprintStateValues, CoopStateComponent, WildernessPoiComponent, GameStateComponent, DayNightCycle, GameStateValues, CampCoreComponent, ScreenAlertComponent, InvasionSpawner, SpireComponent } from "../ecs/components";
import { createFSMSystem } from "../ecs/systems/FSMSystem";
import { createPlayerInputSystem } from "../ecs/systems/PlayerInputSystem";
import { createSplitCameraSystem } from "../ecs/systems/SplitCameraSystem";
import { createCoopSystem } from "../ecs/systems/CoopSystem";
import { createClimbingSystem } from "../ecs/systems/ClimbingSystem";
import { createCombatSystem } from "../ecs/systems/CombatSystem";
import { createRenderSyncSystem } from "../ecs/systems/RenderSyncSystem";
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import { createDeathSystem } from "../ecs/systems/DeathSystem";
import { createCampEnergySystem } from "../ecs/systems/CampEnergySystem";
import { createSpireGrowthSystem } from "../ecs/systems/SpireGrowthSystem";
import { createMonsterSpawnSystem } from "../ecs/systems/MonsterSpawnSystem";
import { createSpireDirectorSystem } from "../ecs/systems/SpireDirectorSystem";
import { createCampSiegeSystem } from "../ecs/systems/CampSiegeSystem";
import { createFloorCollapseSystem } from "../ecs/systems/FloorCollapseSystem";
import { createGameStateSystem } from "../ecs/systems/GameStateSystem";
import { createCommanderSupportSystem } from "../ecs/systems/CommanderSupportSystem";
import { createLeaderDeathSystem } from "../ecs/systems/LeaderDeathSystem";
import { createCombatFeedbackSystem } from "../ecs/systems/CombatFeedbackSystem";
import { AudioManager } from "../audio/AudioManager";
import { loadUnitData, loadCampConfig, loadSpireConfig } from "../data/loader";
import { defineQuery, addEntity, addComponent } from "bitecs";
import { SpriteMap } from "../ecs/systems/RenderSyncSystem";
import { createHUDSystem } from "../ecs/systems/HUDSystem";
import { resetWorldState } from "../ecs/world";
import { createBuildingSystem } from "../ecs/systems/BuildingSystem";
import { createRecruitmentSystem } from "../ecs/systems/RecruitmentSystem";
import { createProgressionXPSystem } from "../ecs/systems/ProgressionXPSystem";
import { createAetherSpawningSystem } from "../ecs/systems/AetherSpawningSystem";
import { createAetherCollectionSystem } from "../ecs/systems/AetherCollectionSystem";
import { ANIM_DEFS } from "../gfx/AnimationKeys";


import { loadCampSaveState, saveCampSaveState } from "../persistence/RunStateManager";

export class GameScene extends Phaser.Scene {
  private fsmSystem!: ReturnType<typeof createFSMSystem>;
  private movementSystem!: ReturnType<typeof createMovementSystem>;
  private combatSystem!: ReturnType<typeof createCombatSystem>;
  private leaderDeathSystem!: ReturnType<typeof createLeaderDeathSystem>;
  private deathSystem!: ReturnType<typeof createDeathSystem>;
  private campEnergySystem!: ReturnType<typeof createCampEnergySystem>;
  private spireGrowthSystem!: ReturnType<typeof createSpireGrowthSystem>;
  private monsterSpawnSystem!: ReturnType<typeof createMonsterSpawnSystem>;
  private spireDirectorSystem!: ReturnType<typeof createSpireDirectorSystem>;
  private campSiegeSystem!: ReturnType<typeof createCampSiegeSystem>;
  private floorCollapseSystem!: ReturnType<typeof createFloorCollapseSystem>;
  private gameStateSystem!: ReturnType<typeof createGameStateSystem>;
  private commanderSupportSystem!: ReturnType<typeof createCommanderSupportSystem>;
  private renderSyncSystem!: ReturnType<typeof createRenderSyncSystem>;
  private hudSystem!: ReturnType<typeof createHUDSystem>;
  private playerInputSystem!: ReturnType<typeof createPlayerInputSystem>;
  private climbingSystem!: ReturnType<typeof createClimbingSystem>;
  private splitCameraSystem!: ReturnType<typeof createSplitCameraSystem>;
  private coopSystem!: ReturnType<typeof createCoopSystem>;
  private dayNightSystem!: ReturnType<typeof createDayNightSystem>;
  private buildingSystem!: ReturnType<typeof createBuildingSystem>;
  private recruitmentSystem!: ReturnType<typeof createRecruitmentSystem>;
  private progressionXPSystem!: ReturnType<typeof createProgressionXPSystem>;
  private aetherSpawningSystem!: ReturnType<typeof createAetherSpawningSystem>;
  private aetherCollectionSystem!: ReturnType<typeof createAetherCollectionSystem>;
  private combatFeedbackSystem!: ReturnType<typeof createCombatFeedbackSystem>;
  private audioManager!: AudioManager;

  private spriteMap: SpriteMap = new Map();
  private isReady = false;
  private isGameOver = false;
  private prevIsNight: number = -1;
  private bgMountains!: Phaser.GameObjects.TileSprite;
  private bgTrees!: Phaser.GameObjects.TileSprite;
  private screenAlertEid!: number;

  private stateQuery = defineQuery([GameStateComponent]);
  private coreQuery = defineQuery([CampCoreComponent]);
  private dayNightQuery = defineQuery([DayNightCycle]);

  constructor() {
    super("GameScene");
  }

  init(_data?: { coop?: boolean }) {
    this.isReady = false;
    this.isGameOver = false;
    this.prevIsNight = -1;
    this.spriteMap.clear();
    resetWorldState(world);
  }

  async create() {
    (window as any).__breachspire = {
      world,
      InvasionSpawner,
      SpireComponent,
    };

    this.hudSystem = createHUDSystem(this);
    this.buildingSystem = createBuildingSystem();
    this.recruitmentSystem = createRecruitmentSystem();
    this.progressionXPSystem = createProgressionXPSystem();

    // Setup Audio and Feedback
    this.audioManager = new AudioManager();

    // Unlock Audio Context and start Day BGM on first interaction (pointer, keyboard, or immediate)
    const startAudio = () => {
      this.audioManager.startBGM();
      this.audioManager.setMusicMood('day', 0);
    };

    startAudio();
    this.input.once('pointerdown', startAudio);
    this.input.keyboard?.once('keydown', startAudio);
    window.addEventListener('keydown', startAudio, { once: true });
    window.addEventListener('pointerdown', startAudio, { once: true });

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
    this.physics?.world.setBounds(0, 0, 3200, 1200);
    this.cameras.main.setBounds(0, 0, 3200, 1200);
    this.cameras.main.setZoom(2.0);

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
      // Load all game data via validated loaders
      const commanderData = await loadUnitData("/data/heroes/commander.json");
      const monsterData = await loadUnitData("/data/monsters/goblin.json");
      const archerData = await loadUnitData("/data/heroes/archer.json");
      const darkArcherData = await loadUnitData("/data/monsters/dark_archer.json");
      const trollData = await loadUnitData("/data/monsters/troll.json");
      const cultistData = await loadUnitData("/data/monsters/cultist.json");
      const campConfig = await loadCampConfig("/data/camp/camp_config.json");
      const spireConfig = await loadSpireConfig("/data/spires/spire_config.json");

      const defendersMap = {
        cultist: cultistData,
        goblin: monsterData,
        troll: trollData,
        dark_archer: darkArcherData,
      };

      // ── Register Animations (wiring only — no gameplay logic) ────────────────
      for (const def of ANIM_DEFS) {
        if (!this.textures.exists(def.key)) continue;
        if (!this.anims.exists(`${def.key}_idle`)) {
          this.anims.create({
            key: `${def.key}_idle`,
            frames: this.anims.generateFrameNumbers(def.key, { start: 0, end: def.idleEnd }),
            frameRate: Math.max(2, Math.floor(def.frameRate / 2)),
            repeat: -1,
          });
        }
        if (!this.anims.exists(`${def.key}_walk`)) {
          this.anims.create({
            key: `${def.key}_walk`,
            frames: this.anims.generateFrameNumbers(def.key, { start: 0, end: def.walkEnd }),
            frameRate: def.frameRate,
            repeat: -1,
          });
        }
      }

      // Set up systems
      this.fsmSystem = createFSMSystem();
      this.movementSystem = createMovementSystem();
      this.combatSystem = createCombatSystem();
      this.leaderDeathSystem = createLeaderDeathSystem();
      this.deathSystem = createDeathSystem(this.spriteMap);
      this.campEnergySystem = createCampEnergySystem();
      this.spireGrowthSystem = createSpireGrowthSystem();
      this.monsterSpawnSystem = createMonsterSpawnSystem(monsterData, darkArcherData, trollData);
      this.spireDirectorSystem = createSpireDirectorSystem();
      this.campSiegeSystem = createCampSiegeSystem();
      this.floorCollapseSystem = createFloorCollapseSystem();
      this.gameStateSystem = createGameStateSystem();
      this.commanderSupportSystem = createCommanderSupportSystem();
      this.renderSyncSystem = createRenderSyncSystem(this, this.spriteMap);
      this.coopSystem = createCoopSystem(f2Key, archerData);
      this.dayNightSystem = createDayNightSystem();

      const worldWidth = 3200;
      const coreX = 1600;
      const centerY = 650;
      const sw = this.scale.width;
      const sh = this.scale.height;

      // ── Backgrounds (Kingdom Two Crowns aesthetic) ───────────────────────────
      // Sky — full screen, fixed
      this.add.tileSprite(sw / 2, sh / 2, sw, sh, "bg_sky")
        .setScrollFactor(0).setDepth(-10);

      // Misty Pine Forest Parallax Layer — dense evergreens down to the grass
      this.bgTrees = this.add.tileSprite(worldWidth / 2, centerY - 20, worldWidth, 550, "bg_forest_mist")
        .setScrollFactor(0.2, 1.0).setDepth(-8);

      // Authentic Kingdom Two Crowns Ground Embankment (Cobblestone path, stone block wall, soil strata & water reflection)
      this.add.tileSprite(worldWidth / 2, centerY + 70, worldWidth, 320, "bg_ground_embankment")
        .setScrollFactor(1.0).setDepth(0);

      // Deep water / bedrock fill below embankment
      this.add.rectangle(worldWidth / 2, centerY + 300, worldWidth, 400, 0x0a0c10)
        .setScrollFactor(1.0).setDepth(0);

      // Center the camera on the avatar
      this.cameras.main.centerOn(1480, centerY);

      createGameStateEntity(world);
      createDayNightEntity(world);

      // Coop Entity
      const coopEid = addEntity(world);
      addComponent(world, CoopStateComponent, coopEid);
      CoopStateComponent.isCoopActive[coopEid] = 0;
      CoopStateComponent.player1Eid[coopEid] = -1;
      CoopStateComponent.player2Eid[coopEid] = -1;

      // Spawn Camp Core
      createCampCoreEntity(world, campConfig, coreX, centerY);

      // Spawn Spires
      const leftSpire = createSpireEntity(world, spireConfig, SpireSideValues.Left, 200, centerY, defendersMap);
      const rightSpire = createSpireEntity(world, spireConfig, SpireSideValues.Right, 3000, centerY, defendersMap);

      // Spawn invasion spawners
      createInvasionSpawner(world, leftSpire, SpireSideValues.Left, 3000, 3);
      createInvasionSpawner(world, rightSpire, SpireSideValues.Right, 3000, 3);

      // ── Tool Stands in Town (Kingdom Two Crowns Economy) ─────────────────────
      const spawnPoi = (type: number, x: number, y: number) => {
        const poiEid = addEntity(world);
        addComponent(world, Position, poiEid);
        Position.x[poiEid] = x;
        Position.y[poiEid] = y;
        addComponent(world, WildernessPoiComponent, poiEid);
        WildernessPoiComponent.poiType[poiEid] = type;
        WildernessPoiComponent.x[poiEid] = x;
        return poiEid;
      };

      // Tool Guild Stands
      spawnPoi(5, 1450, centerY); // Bow Stand (Archer Guild, 15 Aether)
      spawnPoi(4, 1750, centerY); // Hammer Stand (Builder Guild, 10 Aether)
      spawnPoi(6, 1350, centerY); // Sword Stand (Knight Guild, 20 Aether)

      // Vagrant Camps in Wilderness
      spawnPoi(3, 550, centerY);  // Left Vagrant Camp
      spawnPoi(3, 2650, centerY); // Right Vagrant Camp

      // Shrines
      spawnPoi(0, 750, centerY);  // Left Shrine
      spawnPoi(0, 2450, centerY); // Right Shrine

      // ── Unemployed People (Peasants / Wanderers) ─────────────────────────────
      const spawnPeasant = (x: number, y: number) => {
        const pEid = addEntity(world);
        addComponent(world, Position, pEid);
        Position.x[pEid] = x;
        Position.y[pEid] = y;

        addComponent(world, Velocity, pEid);
        Velocity.x[pEid] = 0;
        Velocity.y[pEid] = 0;

        addComponent(world, Speed, pEid);
        Speed.value[pEid] = 40;

        addComponent(world, Health, pEid);
        Health.max[pEid] = 50;
        Health.current[pEid] = 50;

        addComponent(world, FactionTag, pEid);
        FactionTag.faction[pEid] = FactionValues.Hero;

        addComponent(world, UnitRole, pEid);
        UnitRole.role[pEid] = RoleValues.PEASANT;
        UnitRole.level[pEid] = 1;
        UnitRole.xp[pEid] = 0;
        UnitRole.nextLevelXp[pEid] = 50;
        return pEid;
      };

      // Starting wanderers sitting by vagrant camps
      spawnPeasant(530, centerY);
      spawnPeasant(570, centerY);
      spawnPeasant(2630, centerY);
      spawnPeasant(2670, centerY);

      // Starting unemployed citizens in base camp
      spawnPeasant(1530, centerY);
      spawnPeasant(1670, centerY);

      // ── Procedural / Randomized Wall Mounds & Debris ─────────────────────────
      const spawnWallMound = (x: number, y: number) => {
        const bpEid = addEntity(world);
        addComponent(world, Position, bpEid);
        Position.x[bpEid] = x;
        Position.y[bpEid] = y;

        addComponent(world, WallBlueprint, bpEid);
        WallBlueprint.state[bpEid] = BlueprintStateValues.MOUND;
        WallBlueprint.cost[bpEid] = 10;
        WallBlueprint.progress[bpEid] = 0;
        WallBlueprint.targetWallEid[bpEid] = -1;
        return bpEid;
      };

      // Inner camp boundary mounds (randomized ± 30px)
      const leftInnerWallX = 1200 + Math.floor(Math.random() * 40 - 20);
      const rightInnerWallX = 2000 + Math.floor(Math.random() * 40 - 20);
      createCampWallEntity(world, campConfig, SpireSideValues.Left, leftInnerWallX, centerY);
      createCampWallEntity(world, campConfig, SpireSideValues.Right, rightInnerWallX, centerY);

      // Outer expansion wall debris / mounds (randomized ± 40px)
      const leftOuterMoundX = 850 + Math.floor(Math.random() * 60 - 30);
      const rightOuterMoundX = 2350 + Math.floor(Math.random() * 60 - 30);
      spawnWallMound(leftOuterMoundX, centerY);
      spawnWallMound(rightOuterMoundX, centerY);

      // Spawn Player Unit
      const knightEntity = createUnitEntity(world, commanderData, 1480, centerY);
      setPlayerControlled(world, knightEntity, 1);
      CoopStateComponent.player1Eid[coopEid] = knightEntity;

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
    this.floorCollapseSystem(world, delta);
    this.spireDirectorSystem(world, delta);
    this.monsterSpawnSystem(world, delta);
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
      this.audioManager?.playDefeatStinger?.();
    } else {
      this.audioManager?.playVictoryStinger?.();
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

    const text = isVictory ? "VICTORY" : "DEFEAT - THE COMMANDER HAS FALLEN";
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
