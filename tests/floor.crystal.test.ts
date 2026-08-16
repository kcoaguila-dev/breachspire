import { describe, it, expect } from 'vitest';
import { createWorld, addEntity, hasComponent, addComponent } from 'bitecs';
import { createFloorCollapseSystem } from '../src/ecs/systems/FloorCollapseSystem';
import { FloorComponent, FloorDefenderComponent } from '../src/ecs/components';

describe('Floor Collapse and Defenders Removal', () => {
  it('should remove assigned defenders when floor collapses', () => {
    const world = createWorld();

    // Create floor
    const floorEid = addEntity(world);
    addComponent(world, FloorComponent, floorEid);
    FloorComponent.barricadeHP[floorEid] = 0; // Collapsible
    FloorComponent.cleared[floorEid] = 0;
    FloorComponent.active[floorEid] = 1;

    // Create defender
    const defEid = addEntity(world);
    addComponent(world, FloorDefenderComponent, defEid);
    FloorDefenderComponent.floorEid[defEid] = floorEid;

    const collapseSystem = createFloorCollapseSystem();

    // Check defender exists
    expect(hasComponent(world, FloorDefenderComponent, defEid)).toBe(true);

    collapseSystem(world, 16);

    // Defender should be removed
    expect(hasComponent(world, FloorDefenderComponent, defEid)).toBe(false);
  });
});
