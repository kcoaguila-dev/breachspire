import { CampUpgrade } from "../data/schemas";

export interface CampSaveState {
  runCount: number;
  unlockedUpgrades: string[];
  totalAetherEarned: number;
  recruitedHeroes: string[];
}

const STORAGE_KEY = "breachspire_camp_save";

const DEFAULT_SAVE_STATE: CampSaveState = {
  runCount: 0,
  unlockedUpgrades: [],
  totalAetherEarned: 0,
  recruitedHeroes: []
};

export function serializeSaveState(state: CampSaveState): string {
  return JSON.stringify(state);
}

export function deserializeSaveState(json: string): CampSaveState {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_SAVE_STATE };
    }

    return {
      runCount: typeof parsed.runCount === "number" ? parsed.runCount : 0,
      unlockedUpgrades: Array.isArray(parsed.unlockedUpgrades) ? parsed.unlockedUpgrades : [],
      totalAetherEarned: typeof parsed.totalAetherEarned === "number" ? parsed.totalAetherEarned : 0,
      recruitedHeroes: Array.isArray(parsed.recruitedHeroes) ? parsed.recruitedHeroes : []
    };
  } catch (e) {
    return { ...DEFAULT_SAVE_STATE };
  }
}

export function loadCampSaveState(): CampSaveState {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULT_SAVE_STATE };
  }
  const item = localStorage.getItem(STORAGE_KEY);
  if (!item) {
    return { ...DEFAULT_SAVE_STATE };
  }
  return deserializeSaveState(item);
}

export function saveCampSaveState(state: CampSaveState): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, serializeSaveState(state));
}

export function resetCampSaveState(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function calculateUpgradeBonuses(
  unlockedUpgradeIds: string[],
  allUpgrades: CampUpgrade[]
): { wallHpBonus: number; energyRateBonus: number; flightBonus: number } {
  let wallHpBonus = 0;
  let energyRateBonus = 0;
  let flightBonus = 0;

  const unlockedSet = new Set(unlockedUpgradeIds);

  for (const upgrade of allUpgrades) {
    if (unlockedSet.has(upgrade.id)) {
      if (upgrade.effectType === "wall_hp") {
        wallHpBonus += upgrade.value;
      } else if (upgrade.effectType === "energy_rate") {
        energyRateBonus += upgrade.value;
      } else if (upgrade.effectType === "flight_duration") {
        flightBonus += upgrade.value;
      }
    }
  }

  return { wallHpBonus, energyRateBonus, flightBonus };
}
