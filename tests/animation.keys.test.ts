import { describe, it, expect } from 'vitest';
import { getAnimBaseKey, ANIM_DEFS } from '../src/gfx/AnimationKeys';
import { FactionValues, CombatTypeValues } from '../src/ecs/components';

describe('Animation Keys and Spritesheet Definitions', () => {
  it('should map Melee heroes to anim_knight (not anim_commander)', () => {
    const meleeHeroKey = getAnimBaseKey(FactionValues.Hero, CombatTypeValues.Melee, false);
    expect(meleeHeroKey).toBe('anim_knight');
  });

  it('should map Ranged heroes to anim_archer', () => {
    const rangedHeroKey = getAnimBaseKey(FactionValues.Hero, CombatTypeValues.Ranged, false);
    expect(rangedHeroKey).toBe('anim_archer');
  });

  it('should map Magic heroes to anim_mage', () => {
    const magicHeroKey = getAnimBaseKey(FactionValues.Hero, CombatTypeValues.Magic, false);
    expect(magicHeroKey).toBe('anim_mage');
  });

  it('should map Flying heroes to anim_valkyrie', () => {
    const flyingHeroKey = getAnimBaseKey(FactionValues.Hero, CombatTypeValues.Ranged, true);
    expect(flyingHeroKey).toBe('anim_valkyrie');
  });

  it('should map Monsters correctly', () => {
    expect(getAnimBaseKey(FactionValues.Monster, CombatTypeValues.Melee, false)).toBe('anim_troll');
    expect(getAnimBaseKey(FactionValues.Monster, CombatTypeValues.Ranged, false)).toBe('anim_goblin');
    expect(getAnimBaseKey(FactionValues.Monster, CombatTypeValues.Magic, false)).toBe('anim_cultist');
  });

  it('should define exact frame counts and valid walkEnd for all spritesheets', () => {
    const mageDef = ANIM_DEFS.find((d) => d.key === 'anim_mage');
    expect(mageDef).toBeDefined();
    expect(mageDef?.frames).toBe(5);
    expect(mageDef?.walkEnd).toBe(4);

    const commanderDef = ANIM_DEFS.find((d) => d.key === 'anim_commander');
    expect(commanderDef).toBeDefined();
    expect(commanderDef?.frames).toBe(6);

    const knightDef = ANIM_DEFS.find((d) => d.key === 'anim_knight');
    expect(knightDef).toBeDefined();
    expect(knightDef?.frames).toBe(6);
  });
});
