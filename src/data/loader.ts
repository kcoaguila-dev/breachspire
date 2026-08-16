import { UnitStats, UnitStatsSchema } from "./schemas";

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