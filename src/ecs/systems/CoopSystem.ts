import { defineQuery, IWorld, removeEntity } from "bitecs";
import { CoopStateComponent, CampCoreComponent, Position, PlayerControlled, InputStateComponent, Health, GameStateComponent, GameStateValues } from "../components";
import { createUnitEntity, setPlayerControlled } from "../world";
import { UnitStats } from "../../data/schemas";

const coopQuery = defineQuery([CoopStateComponent]);
const coreQuery = defineQuery([CampCoreComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, Position, Health, InputStateComponent]);
const stateQuery = defineQuery([GameStateComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────

export function canDropInPlayer2(isCoopActive: boolean): boolean {
  return !isCoopActive;
}

export function canRevivePartner(reviverEnergy: number, revivalCost: number, isPartnerDowned: boolean): boolean {
  return isPartnerDowned && reviverEnergy >= revivalCost;
}

export function shouldTriggerCoopDefeat(p1Downed: boolean, p2Downed: boolean): boolean {
  return p1Downed && p2Downed;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

export function createCoopSystem(f2Key: Phaser.Input.Keyboard.Key, p2Data: UnitStats) {
  let wasF2Down = false;
  const REVIVAL_COST = 10;
  const REVIVAL_RANGE = 65;

  return (world: IWorld, _delta: number): IWorld => {
    // 1. Check F2 Hotkey for Drop-in / Drop-out
    const isF2Down = f2Key.isDown;
    const justPressed = isF2Down && !wasF2Down;
    wasF2Down = isF2Down;

    const coopEids = coopQuery(world);
    if (coopEids.length > 0) {
      const coopEid = coopEids[0];
      const isCoopActive = CoopStateComponent.isCoopActive[coopEid] === 1;

      if (justPressed) {
        if (canDropInPlayer2(isCoopActive)) {
          // Spawn Player 2 at Camp Core
          const cores = coreQuery(world);
          let spawnX = 16000;
          let spawnY = 650;

          if (cores.length > 0) {
            spawnX = Position.x[cores[0]];
            spawnY = Position.y[cores[0]];
          }

          const p2Eid = createUnitEntity(world, p2Data, spawnX, spawnY);
          setPlayerControlled(world, p2Eid, 2, 20);

          CoopStateComponent.isCoopActive[coopEid] = 1;
          CoopStateComponent.player2Eid[coopEid] = p2Eid;
        } else {
          // Drop-out
          const p2Eid = CoopStateComponent.player2Eid[coopEid];
          if (p2Eid) {
            removeEntity(world, p2Eid);
            CoopStateComponent.isCoopActive[coopEid] = 0;
            CoopStateComponent.player2Eid[coopEid] = 0;
          }
        }
      }

      // 2. Co-op Partner Revival & Shared Survival Loop
      if (CoopStateComponent.isCoopActive[coopEid] === 1) {
        const players = playerQuery(world);
        let p1Eid = -1;
        let p2Eid = -1;

        for (let i = 0; i < players.length; i++) {
          if (PlayerControlled.playerId[players[i]] === 1) p1Eid = players[i];
          if (PlayerControlled.playerId[players[i]] === 2) p2Eid = players[i];
        }

        if (p1Eid !== -1 && p2Eid !== -1) {
          const p1Down = PlayerControlled.isDowned[p1Eid] === 1;
          const p2Down = PlayerControlled.isDowned[p2Eid] === 1;

          // Case A: Both players downed -> DEFEAT
          if (shouldTriggerCoopDefeat(p1Down, p2Down)) {
            const states = stateQuery(world);
            if (states.length > 0) {
              GameStateComponent.state[states[0]] = GameStateValues.DEFEAT;
            }
          }

          // Case B: P1 alive, P2 downed -> P1 can revive P2
          else if (!p1Down && p2Down) {
            const dist = Math.abs(Position.x[p1Eid] - Position.x[p2Eid]);
            if (dist <= REVIVAL_RANGE && InputStateComponent.attack[p1Eid]) {
              const p1Energy = PlayerControlled.energy[p1Eid];
              if (canRevivePartner(p1Energy, REVIVAL_COST, true)) {
                PlayerControlled.energy[p1Eid] -= REVIVAL_COST;
                PlayerControlled.isDowned[p2Eid] = 0;
                PlayerControlled.energy[p2Eid] = 10;
                Health.current[p2Eid] = Health.max[p2Eid];
              }
            }
          }

          // Case C: P2 alive, P1 downed -> P2 can revive P1
          else if (!p2Down && p1Down) {
            const dist = Math.abs(Position.x[p2Eid] - Position.x[p1Eid]);
            if (dist <= REVIVAL_RANGE && InputStateComponent.attack[p2Eid]) {
              const p2Energy = PlayerControlled.energy[p2Eid];
              if (canRevivePartner(p2Energy, REVIVAL_COST, true)) {
                PlayerControlled.energy[p2Eid] -= REVIVAL_COST;
                PlayerControlled.isDowned[p1Eid] = 0;
                PlayerControlled.energy[p1Eid] = 10;
                Health.current[p1Eid] = Health.max[p1Eid];
              }
            }
          }
        }
      }
    }

    return world;
  };
}
