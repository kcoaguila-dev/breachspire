import { describe, it, expect } from 'vitest';
import { computeFlightEnergyDrain, computeFlightEnergyRecharge, canRechargeFlight } from '../src/ecs/systems/FlightEnergySystem';

describe('Flight Energy Logic', () => {
  it('drains energy correctly when airborne', () => {
    // current, drainRate, deltaMs
    const current = 8.0;
    const drainRate = 1.0;
    const deltaMs = 1000; // 1 second
    const newEnergy = computeFlightEnergyDrain(current, drainRate, deltaMs);
    expect(newEnergy).toBe(7.0);
  });

  it('clamps energy at 0 when draining', () => {
    const current = 0.5;
    const drainRate = 1.0;
    const deltaMs = 1000; // 1 second
    const newEnergy = computeFlightEnergyDrain(current, drainRate, deltaMs);
    expect(newEnergy).toBe(0.0);
  });

  it('recharges energy correctly', () => {
    // current, max, rechargeRate, deltaMs
    const current = 2.0;
    const max = 8.0;
    const rechargeRate = 2.0;
    const deltaMs = 1000; // 1 second
    const newEnergy = computeFlightEnergyRecharge(current, max, rechargeRate, deltaMs);
    expect(newEnergy).toBe(4.0);
  });

  it('clamps energy at max when recharging', () => {
    const current = 7.5;
    const max = 8.0;
    const rechargeRate = 2.0;
    const deltaMs = 1000; // 1 second
    const newEnergy = computeFlightEnergyRecharge(current, max, rechargeRate, deltaMs);
    expect(newEnergy).toBe(8.0);
  });

  it('allows recharge ONLY on cleared tower floors and NEVER at base camp', () => {
    expect(canRechargeFlight(true, false)).toBe(true);  // Cleared floor, NOT at base camp -> YES
    expect(canRechargeFlight(false, false)).toBe(false); // Uncleared floor, NOT at base camp -> NO
    expect(canRechargeFlight(true, true)).toBe(false);   // Cleared floor(?), AT base camp -> NO
    expect(canRechargeFlight(false, true)).toBe(false);  // AT base camp -> NO
  });
});
