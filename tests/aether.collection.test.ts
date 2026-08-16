import { describe, it, expect } from "vitest";
import { shouldMagnetizeMote, computeMoteVelocity, isMoteCollected } from "../src/ecs/systems/AetherCollectionSystem";
import { shouldSpawnMote } from "../src/ecs/systems/AetherSpawningSystem";
import { createWorld, addEntity, addComponent } from "bitecs";
import { CampCoreComponent, AetherMoteComponent, Position, PlayerControlled, Health } from "../src/ecs/components";
import { createAetherCollectionSystem } from "../src/ecs/systems/AetherCollectionSystem";

describe("AetherSpawningSystem — pure functions", () => {
    it("should allow spawning if timer >= cooldown and current motes < max", () => {
        expect(shouldSpawnMote(4000, 4000, 5, 10)).toBe(true);
        expect(shouldSpawnMote(5000, 4000, 5, 10)).toBe(true);
    });

    it("should prevent spawning if timer < cooldown", () => {
        expect(shouldSpawnMote(3000, 4000, 5, 10)).toBe(false);
    });

    it("should prevent spawning if max motes reached", () => {
        expect(shouldSpawnMote(4000, 4000, 10, 10)).toBe(false);
        expect(shouldSpawnMote(4000, 4000, 11, 10)).toBe(false);
    });
});

describe("AetherCollectionSystem — pure functions", () => {
    describe("shouldMagnetizeMote()", () => {
        it("should return true when within magnet radius", () => {
            expect(shouldMagnetizeMote(100, 100, 150, 100, 120)).toBe(true);
            expect(shouldMagnetizeMote(100, 100, 100, 200, 120)).toBe(true);
        });

        it("should return false when outside magnet radius", () => {
            expect(shouldMagnetizeMote(100, 100, 300, 100, 120)).toBe(false);
            expect(shouldMagnetizeMote(100, 100, 100, 300, 120)).toBe(false);
        });
    });

    describe("computeMoteVelocity()", () => {
        it("should move towards target with correct speed magnitude", () => {
            const vel = computeMoteVelocity(0, 0, 100, 0, 50);
            expect(vel.vx).toBeCloseTo(50);
            expect(vel.vy).toBeCloseTo(0);
        });

        it("should handle diagonal movement correctly", () => {
            const vel = computeMoteVelocity(0, 0, 100, 100, 50);
            // vx and vy should be 50 * sqrt(2)/2
            expect(vel.vx).toBeCloseTo(35.355);
            expect(vel.vy).toBeCloseTo(35.355);
        });

        it("should return zero velocity if mote is exactly at target", () => {
            const vel = computeMoteVelocity(100, 100, 100, 100, 50);
            expect(vel.vx).toBe(0);
            expect(vel.vy).toBe(0);
        });
    });

    describe("isMoteCollected()", () => {
        it("should return true when within pickup radius", () => {
            expect(isMoteCollected(100, 100, 110, 100, 25)).toBe(true);
        });

        it("should return false when outside pickup radius", () => {
            expect(isMoteCollected(100, 100, 150, 100, 25)).toBe(false);
        });
    });
});

describe("AetherCollectionSystem — system integration", () => {
    it("should clamp energy gain at maxEnergy", () => {
        const world = createWorld();

        // Setup Camp Core
        const campEid = addEntity(world);
        addComponent(world, CampCoreComponent, campEid);
        CampCoreComponent.lightEnergy[campEid] = 95; // 5 below max
        CampCoreComponent.maxEnergy[campEid] = 100;

        // Setup Player
        const playerEid = addEntity(world);
        addComponent(world, PlayerControlled, playerEid);
        addComponent(world, Position, playerEid);
        Position.x[playerEid] = 100;
        Position.y[playerEid] = 100;
        addComponent(world, Health, playerEid);
        Health.current[playerEid] = 100; // Player is alive

        // Setup Mote (already magnetized and within pickup radius)
        const moteEid = addEntity(world);
        addComponent(world, AetherMoteComponent, moteEid);
        AetherMoteComponent.isMagnetized[moteEid] = 1;
        AetherMoteComponent.value[moteEid] = 10;
        addComponent(world, Position, moteEid);
        Position.x[moteEid] = 100;
        Position.y[moteEid] = 100; // Directly on player

        const system = createAetherCollectionSystem();
        system(world, 16); // Run 1 frame

        // Energy should be clamped at max (100), not 105
        expect(CampCoreComponent.lightEnergy[campEid]).toBe(100);
    });
});
