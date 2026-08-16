import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, InputStateComponent, Position, Velocity, ClimbingState, FloorComponent, Health } from "../components";

const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position, Velocity, ClimbingState, Health]);
const floorQuery = defineQuery([FloorComponent, Position, Health]);

// Pure Logic
export function canClimbLadder(heroX: number, heroY: number, ladderX: number, ladderBottomY: number, ladderTopY: number): boolean {
    const LADDER_WIDTH = 32;
    const isWithinX = Math.abs(heroX - ladderX) <= LADDER_WIDTH / 2;

    // Y coords in Phaser increase downwards. ladderTopY is smaller than ladderBottomY.
    // Allow climbing if hero is near or between these vertical bounds.
    const isWithinY = heroY >= ladderTopY - 10 && heroY <= ladderBottomY + 10;

    return isWithinX && isWithinY;
}

export function createClimbingSystem() {
    return (world: IWorld, _delta: number): IWorld => {
        const players = playerQuery(world);
        const floors = floorQuery(world);

        for (let i = 0; i < players.length; i++) {
            const eid = players[i];

            if (Health.current[eid] <= 0) continue;

            const up = InputStateComponent.up[eid];
            const down = InputStateComponent.down[eid];
            const isClimbing = ClimbingState.isClimbing[eid];

            const heroX = Position.x[eid];
            const heroY = Position.y[eid];

            if (isClimbing === 0 && (up === 1 || down === 1)) {
                // Not climbing, check for ladders to start climbing
                // Ladders exist at floor X, going from FloorY to FloorY - 120
                for (let j = 0; j < floors.length; j++) {
                    const floorEid = floors[j];
                    if (FloorComponent.active[floorEid] === 0) continue;

                    // We assume ladder is centrally located in the floor
                    const ladderX = Position.x[floorEid];
                    const ladderBottomY = Position.y[floorEid];
                    // If going UP, top is ladderBottomY - 120
                    const ladderTopY = ladderBottomY - 120;

                    if (canClimbLadder(heroX, heroY, ladderX, ladderBottomY, ladderTopY)) {
                        ClimbingState.isClimbing[eid] = 1;
                        ClimbingState.ladderX[eid] = ladderX;
                        // Center horizontally on ladder
                        Position.x[eid] = ladderX;
                        Velocity.x[eid] = 0;

                        if (up === 1) {
                            Velocity.y[eid] = -100;
                            ClimbingState.targetFloorY[eid] = ladderTopY;
                        } else if (down === 1) {
                            Velocity.y[eid] = 100;
                            ClimbingState.targetFloorY[eid] = ladderBottomY;
                        }
                        break;
                    }
                }
            } else if (isClimbing === 1) {
                // Already climbing
                // Lock horizontal motion
                Position.x[eid] = ClimbingState.ladderX[eid];
                Velocity.x[eid] = 0;

                let targetY = ClimbingState.targetFloorY[eid];

                // Allow reversing direction
                if (up === 1) {
                    Velocity.y[eid] = -100;
                    // Dynamically update targetY based on current ladder context
                    // We just assume the current targetY is correct unless we find another ladder?
                    // Actually, targetY is just the extreme bound. We need to recalculate targetY if we reverse.
                    for (let j = 0; j < floors.length; j++) {
                        const floorEid = floors[j];
                        const ladderX = Position.x[floorEid];
                        const ladderBottomY = Position.y[floorEid];
                        const ladderTopY = ladderBottomY - 120;
                        if (canClimbLadder(heroX, heroY, ladderX, ladderBottomY, ladderTopY)) {
                            targetY = ladderTopY;
                            ClimbingState.targetFloorY[eid] = targetY;
                            break;
                        }
                    }
                } else if (down === 1) {
                    Velocity.y[eid] = 100;
                    for (let j = 0; j < floors.length; j++) {
                        const floorEid = floors[j];
                        const ladderX = Position.x[floorEid];
                        const ladderBottomY = Position.y[floorEid];
                        const ladderTopY = ladderBottomY - 120;
                        if (canClimbLadder(heroX, heroY, ladderX, ladderBottomY, ladderTopY)) {
                            targetY = ladderBottomY;
                            ClimbingState.targetFloorY[eid] = targetY;
                            break;
                        }
                    }
                } else {
                    Velocity.y[eid] = 0;
                }

                // Check if reached top or bottom bounds
                if (Velocity.y[eid] < 0 && heroY <= targetY) {
                    ClimbingState.isClimbing[eid] = 0;
                    Position.y[eid] = targetY;
                    Velocity.y[eid] = 0;
                } else if (Velocity.y[eid] > 0 && heroY >= targetY) {
                    ClimbingState.isClimbing[eid] = 0;
                    Position.y[eid] = targetY;
                    Velocity.y[eid] = 0;
                }
            }
        }

        return world;
    };
}
