import { UnitStats, UnitStatsSchema, FloorData, FloorDataSchema, CampConfig, CampConfigSchema, SpireConfig, SpireConfigSchema, CampUpgrade, CampUpgradeTreeSchema } from "./schemas";

export async function loadUnitData(url: string): Promise<UnitStats> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load data from ${url}: ${response.statusText}`);
  }
  const data = await response.json();

  // Validate and parse the data
  // Invalid data will throw a ZodError immediately here
  return UnitStatsSchema.parse(data);
}

export async function loadAllHeroData(): Promise<Record<string, UnitStats>> {
  const heroIds = ["knight", "warrior", "archer", "mage", "commander"];
  const heroes: Record<string, UnitStats> = {};

  await Promise.all(heroIds.map(async (id) => {
    const data = await loadUnitData(`/data/heroes/${id}.json`);
    heroes[id] = data;
  }));

  return heroes;
}

export async function loadAllMonsterData(): Promise<Record<string, UnitStats>> {
  const monsterIds = ["goblin", "troll", "dark_archer", "cultist"];
  const monsters: Record<string, UnitStats> = {};

  await Promise.all(monsterIds.map(async (id) => {
    const data = await loadUnitData(`/data/monsters/${id}.json`);
    monsters[id] = data;
  }));

  return monsters;
}

export async function loadFloorData(url: string): Promise<FloorData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load floor data from ${url}: ${response.statusText}`);
  }
  const data = await response.json();

  // Throws ZodError immediately if JSON does not match FloorDataSchema.
  // This fires at scene startup — a malformed floor_NN.json is caught before any entity is created.
  return FloorDataSchema.parse(data);
}
export async function loadCampConfig(url: string): Promise<CampConfig> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load camp config from ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  return CampConfigSchema.parse(data);
}

export async function loadSpireConfig(url: string): Promise<SpireConfig> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load spire config from ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  return SpireConfigSchema.parse(data);
}

export async function loadCampUpgrades(url: string): Promise<CampUpgrade[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load camp upgrades from ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  return CampUpgradeTreeSchema.parse(data);
}
