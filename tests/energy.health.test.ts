import { describe, it, expect } from "vitest";
import { calculatePlayerEnergyDamage } from "../src/ecs/systems/CombatSystem";
import { canRevivePartner, shouldTriggerCoopDefeat } from "../src/ecs/systems/CoopSystem";
import { shouldMoteDespawn } from "../src/ecs/systems/AetherCollectionSystem";
import { canSpawnWildlife } from "../src/ecs/systems/WildlifeSystem";
import { createWorld, addEntity, addComponent } from "bitecs";
import {
  Position,
  Health,
  Attack,
  CombatTypeComponent,
  CombatTypeValues,
  PlayerControlled,
  CampCoreComponent,
  GameStateComponent,
  GameStateValues,
  FSMState,
  FSMStateValues,
  InputStateComponent,
  CoopStateComponent,
} from "../src/ecs/components";
import { createCombatSystem } from "../src/ecs/systems/CombatSystem";
import { createCoopSystem } from "../src/ecs/systems/CoopSystem";

describe("Energy-as-Health & Two Crowns Revival Mechanics", () => {
  describe("Pure Logic: Player Energy Damage & Revival", () => {
    it("should absorb damage from energy buffer without dying when energy is sufficient", () => {
      const res = calculatePlayerEnergyDamage(30, 10);
      expect(res.isLethal).toBe(false);
      expect(res.remainingEnergy).toBe(20);
      expect(res.energyDrained).toBe(10);
    });

    it("should trigger lethal strike if energy is 0", () => {
      const res = calculatePlayerEnergyDamage(0, 10);
      expect(res.isLethal).toBe(true);
      expect(res.remainingEnergy).toBe(0);
    });

    it("should trigger lethal strike if incoming damage exceeds remaining energy", () => {
      const res = calculatePlayerEnergyDamage(15, 20);
      expect(res.isLethal).toBe(true);
      expect(res.remainingEnergy).toBe(0);
    });

    it("should evaluate co-op revival conditions accurately", () => {
      // Partner not downed -> cannot revive
      expect(canRevivePartner(20, 10, false)).toBe(false);

      // Partner downed, but reviver doesn't have enough energy (5 < 10) -> cannot revive
      expect(canRevivePartner(5, 10, true)).toBe(false);

      // Partner downed, reviver has enough energy (15 >= 10) -> CAN revive!
      expect(canRevivePartner(15, 10, true)).toBe(true);
    });

    it("should only trigger co-op defeat if BOTH players are downed simultaneously", () => {
      expect(shouldTriggerCoopDefeat(false, false)).toBe(false);
      expect(shouldTriggerCoopDefeat(true, false)).toBe(false);
      expect(shouldTriggerCoopDefeat(false, true)).toBe(false);
      expect(shouldTriggerCoopDefeat(true, true)).toBe(true);
    });

    it("should correctly identify when a dropped energy mote has expired", () => {
      expect(shouldMoteDespawn(18000)).toBe(false);
      expect(shouldMoteDespawn(5000)).toBe(false);
      expect(shouldMoteDespawn(0)).toBe(true);
      expect(shouldMoteDespawn(-50)).toBe(true);
    });

    it("should allow wildlife spawning only in daytime when under cap", () => {
      expect(canSpawnWildlife(5, 12, false)).toBe(true);
      expect(canSpawnWildlife(12, 12, false)).toBe(false);
      expect(canSpawnWildlife(2, 12, true)).toBe(false); // Night
    });
  });

  describe("ECS Integration: Player Damage & Mote Scatter", () => {
    it("should drain player energy and scatter motes when struck by monster", () => {
      const world = createWorld();

      // Camp Core with 40 Energy
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 40;
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;

      // Player at x=15000 with 30 Energy
      const playerEid = addEntity(world);
      addComponent(world, PlayerControlled, playerEid);
      PlayerControlled.playerId[playerEid] = 1;
      PlayerControlled.energy[playerEid] = 30;
      PlayerControlled.isDowned[playerEid] = 0;
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 15000;
      Position.y[playerEid] = 650;
      addComponent(world, Health, playerEid);
      Health.max[playerEid] = 100;
      Health.current[playerEid] = 100;
      addComponent(world, CombatTypeComponent, playerEid);
      CombatTypeComponent.type[playerEid] = CombatTypeValues.Melee;

      // Goblin Monster at x=15020 in melee range attacking Player
      const monsterEid = addEntity(world);
      addComponent(world, Position, monsterEid);
      Position.x[monsterEid] = 15020;
      Position.y[monsterEid] = 650;
      addComponent(world, Health, monsterEid);
      Health.max[monsterEid] = 50;
      Health.current[monsterEid] = 50;
      addComponent(world, Attack, monsterEid);
      Attack.power[monsterEid] = 10;
      addComponent(world, CombatTypeComponent, monsterEid);
      CombatTypeComponent.type[monsterEid] = CombatTypeValues.Melee;
      addComponent(world, FSMState, monsterEid);
      FSMState.state[monsterEid] = FSMStateValues.ENGAGE_TARGET;
      FSMState.targetEntity[monsterEid] = playerEid;

      const combatSystem = createCombatSystem();
      combatSystem(world, 16);

      // Verify energy deducted from 40 to 30
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(30);

      // Verify player is alive
      expect(Health.current[playerEid]).toBe(100);
    });

    it("should trigger Defeat when player is struck with 0 energy in single player", () => {
      const world = createWorld();

      // Game State
      const stateEid = addEntity(world);
      addComponent(world, GameStateComponent, stateEid);
      GameStateComponent.state[stateEid] = GameStateValues.RUNNING;

      // Camp Core with 0 Energy
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 0;
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;

      // Player with 0 Energy
      const playerEid = addEntity(world);
      addComponent(world, PlayerControlled, playerEid);
      PlayerControlled.playerId[playerEid] = 1;
      PlayerControlled.energy[playerEid] = 0;
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 15000;
      Position.y[playerEid] = 650;
      addComponent(world, Health, playerEid);
      Health.max[playerEid] = 100;
      Health.current[playerEid] = 100;
      addComponent(world, CombatTypeComponent, playerEid);

      // Monster attacking player
      const monsterEid = addEntity(world);
      addComponent(world, Position, monsterEid);
      Position.x[monsterEid] = 15020;
      Position.y[monsterEid] = 650;
      addComponent(world, Health, monsterEid);
      Health.max[monsterEid] = 50;
      Health.current[monsterEid] = 50;
      addComponent(world, Attack, monsterEid);
      Attack.power[monsterEid] = 10;
      addComponent(world, CombatTypeComponent, monsterEid);
      addComponent(world, FSMState, monsterEid);
      FSMState.state[monsterEid] = FSMStateValues.ENGAGE_TARGET;
      FSMState.targetEntity[monsterEid] = playerEid;

      const combatSystem = createCombatSystem();
      combatSystem(world, 16);

      // Verify Player killed and GameState is DEFEAT
      expect(Health.current[playerEid]).toBe(0);
      expect(GameStateComponent.state[stateEid]).toBe(GameStateValues.DEFEAT);
    });

    it("should allow living partner to revive downed co-op player for 10 energy", () => {
      const world = createWorld();

      // Coop State Active
      const coopEid = addEntity(world);
      addComponent(world, CoopStateComponent, coopEid);
      CoopStateComponent.isCoopActive[coopEid] = 1;

      // Player 1 (Downed) at x=15000
      const p1Eid = addEntity(world);
      addComponent(world, PlayerControlled, p1Eid);
      PlayerControlled.playerId[p1Eid] = 1;
      PlayerControlled.energy[p1Eid] = 0;
      PlayerControlled.isDowned[p1Eid] = 1;
      addComponent(world, Position, p1Eid);
      Position.x[p1Eid] = 15000;
      Position.y[p1Eid] = 650;
      addComponent(world, Health, p1Eid);
      Health.max[p1Eid] = 100;
      Health.current[p1Eid] = 100;
      addComponent(world, InputStateComponent, p1Eid);

      // Player 2 (Living, with 25 Energy) at x=15020 pressing Attack
      const p2Eid = addEntity(world);
      addComponent(world, PlayerControlled, p2Eid);
      PlayerControlled.playerId[p2Eid] = 2;
      PlayerControlled.energy[p2Eid] = 25;
      PlayerControlled.isDowned[p2Eid] = 0;
      addComponent(world, Position, p2Eid);
      Position.x[p2Eid] = 15020;
      Position.y[p2Eid] = 650;
      addComponent(world, Health, p2Eid);
      Health.max[p2Eid] = 100;
      Health.current[p2Eid] = 100;
      addComponent(world, InputStateComponent, p2Eid);
      InputStateComponent.attack[p2Eid] = 1;

      CoopStateComponent.player1Eid[coopEid] = p1Eid;
      CoopStateComponent.player2Eid[coopEid] = p2Eid;

      const dummyKey = { isDown: false } as any;
      const dummyData = {} as any;
      const coopSystem = createCoopSystem(dummyKey, dummyData);
      coopSystem(world, 16);

      // Verify P2 paid 10 energy: 25 - 10 = 15
      expect(PlayerControlled.energy[p2Eid]).toBe(15);

      // Verify P1 revived with 10 energy
      expect(PlayerControlled.isDowned[p1Eid]).toBe(0);
      expect(PlayerControlled.energy[p1Eid]).toBe(10);
    });
  });
});
