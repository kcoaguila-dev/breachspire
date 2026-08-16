import { defineQuery, IWorld, enterQuery, exitQuery } from "bitecs";
import { Position, FactionTag, FactionValues, Health } from "../components";

const renderQuery = defineQuery([Position, FactionTag, Health]);
const renderQueryEnter = enterQuery(renderQuery);
const renderQueryExit = exitQuery(renderQuery);

export function createRenderSyncSystem(scene: Phaser.Scene, spriteMap: Map<number, Phaser.GameObjects.Rectangle>) {
  return (world: IWorld) => {
    const entered = renderQueryEnter(world);
    for (let i = 0; i < entered.length; i++) {
      const eid = entered[i];
      const faction = FactionTag.faction[eid];
      const color = faction === FactionValues.Hero ? 0x0000ff : 0xff0000;

      const rect = scene.add.rectangle(Position.x[eid], Position.y[eid], 32, 32, color);
      spriteMap.set(eid, rect);
    }

    const entities = renderQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        if (Health.current[eid] <= 0) {
            rect.setAlpha(0.2); // Dead visually
        } else {
            rect.setPosition(Position.x[eid], Position.y[eid]);
        }
      }
    }

    const exited = renderQueryExit(world);
    for (let i = 0; i < exited.length; i++) {
      const eid = exited[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        rect.destroy();
        spriteMap.delete(eid);
      }
    }

    return world;
  };
}