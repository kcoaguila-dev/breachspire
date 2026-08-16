import { describe, it, expect } from 'vitest';
import { computeFloorCollapse } from '../src/ecs/systems/FloorCollapseSystem';

describe('computeFloorCollapse', () => {
    it('should calculate new floor count and spawn rate multiplier correctly', () => {
        const remainingFloors = 5;
        const destroyedFloorIndex = 2;

        const result = computeFloorCollapse(remainingFloors, destroyedFloorIndex);

        expect(result.newFloorCount).toBe(4);
        expect(result.spawnRateMultiplier).toBeGreaterThan(1);
    });

    it('should handle zero remaining floors correctly', () => {
        const remainingFloors = 1;
        const destroyedFloorIndex = 0;

        const result = computeFloorCollapse(remainingFloors, destroyedFloorIndex);

        expect(result.newFloorCount).toBe(0);
        // We will define logic that spawnRateMultiplier could be very high if 0 floors left, or something specific
        expect(result.spawnRateMultiplier).toBeGreaterThanOrEqual(1);
    });
});
