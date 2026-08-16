import { defineQuery, IWorld, removeEntity } from "bitecs";
import { CoopStateComponent, CampCoreComponent, Position } from "../components";
import { createUnitEntity, setPlayerControlled } from "../world";
import { UnitStats } from "../../data/schemas";

const coopQuery = defineQuery([CoopStateComponent]);
const coreQuery = defineQuery([CampCoreComponent, Position]);

// Pure function for testing
export function canDropInPlayer2(isCoopActive: boolean): boolean {
  return !isCoopActive;
}

export function createCoopSystem(f2Key: Phaser.Input.Keyboard.Key, p2Data: UnitStats) {
  let wasF2Down = false;

  return (world: IWorld, _delta: number): IWorld => {
    const isF2Down = f2Key.isDown;
    const justPressed = isF2Down && !wasF2Down;
    wasF2Down = isF2Down;

    if (!justPressed) return world;

    const coopEids = coopQuery(world);
    if (coopEids.length === 0) return world;

    const coopEid = coopEids[0];
    const isCoopActive = CoopStateComponent.isCoopActive[coopEid] === 1;

    if (canDropInPlayer2(isCoopActive)) {
      // Spawn Player 2 at Camp Core
      const cores = coreQuery(world);
      let spawnX = 1600;
      let spawnY = 600;

      if (cores.length > 0) {
        spawnX = Position.x[cores[0]];
        spawnY = Position.y[cores[0]];
      }

      // We need an alternative hero data here (e.g., Archer/Mage). We'll assume p2Data is passed in.
      const p2Eid = createUnitEntity(world, p2Data, spawnX, spawnY);
      setPlayerControlled(world, p2Eid, 2);

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

    return world;
  };
}
