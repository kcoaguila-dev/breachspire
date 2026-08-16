import { describe, it, expect } from 'vitest';
import { createWorld, hasComponent } from 'bitecs';
import { createFloorEntity } from '../src/ecs/world';
import { SpireSideValues, FloorDefenderComponent } from '../src/ecs/components';
import { UnitStats } from '../src/data/schemas';

describe('Spire Defenders Factory Logic', () => {
  it('should spawn defenders and bind them to the floor index', () => {
    const world = createWorld();

    const mockGoblin: UnitStats = {
      id: 'goblin',
      name: 'Goblin',
      faction: 'monster',
      combatType: 'melee',
      health: 10,
      attack: 2,
      speed: 10
    };

    const defendersData = {
      goblin: mockGoblin,
    };

    const floorEid = createFloorEntity(world, SpireSideValues.Left, 1, 100, 200, 650, defendersData);

    // There should be 2 goblins spawned with FloorDefenderComponent bound to floorEid
    let defenderCount = 0;

    // Iterating to check entities
    for (let i = 0; i < 100; i++) {
        if (hasComponent(world, FloorDefenderComponent, i)) {
            if (FloorDefenderComponent.floorEid[i] === floorEid && FloorDefenderComponent.floorIndex[i] === 1) {
               defenderCount++;
            }
        }
    }

    expect(defenderCount).toBe(2);
  });
});
