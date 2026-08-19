import { FactionValues, CombatTypeValues } from "../ecs/components";

/**
 * Returns the animation base key for a unit.
 * Pure — no ECS reads, no Phaser calls. Safe to test with Vitest.
 */
export function getAnimBaseKey(
  faction: number,
  combatType: number,
  isFlying: boolean,
): string {
  if (faction === FactionValues.Hero) {
    if (isFlying)                               return "anim_valkyrie";
    if (combatType === CombatTypeValues.Melee)  return "anim_knight";
    if (combatType === CombatTypeValues.Ranged) return "anim_archer";
    if (combatType === CombatTypeValues.Magic)  return "anim_mage";
    return "anim_knight";
  } else {
    if (combatType === CombatTypeValues.Melee)  return "anim_troll";
    if (combatType === CombatTypeValues.Ranged) return "anim_goblin";
    if (combatType === CombatTypeValues.Magic)  return "anim_cultist";
    return "anim_goblin";
  }
}

export const ANIM_DEFS: {
  key: string;
  file: string;
  frameW: number;
  frameH: number;
  frames: number;
  frameRate: number;
  idleEnd: number;
  walkEnd: number;
}[] = [
  { key: "anim_commander", file: "/sprites/anim/anim_commander.png", frameW: 80, frameH: 80, frames: 6, frameRate: 8, idleEnd: 0, walkEnd: 5 },
  { key: "anim_knight",    file: "/sprites/anim/anim_knight.png",    frameW: 48, frameH: 48, frames: 6, frameRate: 8, idleEnd: 0, walkEnd: 5 },
  { key: "anim_archer",    file: "/sprites/anim/anim_archer.png",    frameW: 48, frameH: 48, frames: 8, frameRate: 8, idleEnd: 1, walkEnd: 7 },
  { key: "anim_mage",      file: "/sprites/anim/anim_mage.png",      frameW: 48, frameH: 48, frames: 5, frameRate: 7, idleEnd: 0, walkEnd: 4 },
  { key: "anim_valkyrie",  file: "/sprites/anim/anim_valkyrie.png",  frameW: 48, frameH: 48, frames: 6, frameRate: 9, idleEnd: 0, walkEnd: 5 },
  { key: "anim_goblin",    file: "/sprites/anim/anim_goblin.png",    frameW: 48, frameH: 48, frames: 8, frameRate: 9, idleEnd: 1, walkEnd: 7 },
  { key: "anim_troll",     file: "/sprites/anim/anim_troll.png",     frameW: 64, frameH: 64, frames: 8, frameRate: 6, idleEnd: 1, walkEnd: 7 },
  { key: "anim_cultist",   file: "/sprites/anim/anim_cultist.png",   frameW: 48, frameH: 48, frames: 6, frameRate: 7, idleEnd: 0, walkEnd: 5 },
];
