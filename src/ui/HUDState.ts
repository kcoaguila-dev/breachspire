export function formatEnergyText(current: number, max: number): string {
  const c = Math.max(0, Math.floor(current));
  const m = Math.max(0, Math.floor(max));
  return `Energy: ${c}/${m}`;
}

export function formatResourceHUDText(
  energy: number,
  maxEnergy: number,
  wood: number,
  iron: number,
  maxWood?: number,
  maxIron?: number
): string {
  const e = Math.max(0, Math.floor(energy));
  const m = Math.max(0, Math.floor(maxEnergy));
  const w = Math.max(0, Math.floor(wood));
  const i = Math.max(0, Math.floor(iron));
  if (maxWood !== undefined && maxIron !== undefined) {
    const mw = Math.max(0, Math.floor(maxWood));
    const mi = Math.max(0, Math.floor(maxIron));
    return `⚡ Energy: ${e}/${m}  |  🪵 Wood: ${w}/${mw}  |  ⛏️ Iron: ${i}/${mi}`;
  }
  return `⚡ Energy: ${e}/${m}  |  🪵 Wood: ${w}  |  ⛏️ Iron: ${i}`;
}

export function formatCoopEnergyHUDText(
  p1Energy: number,
  p1Max: number,
  p1Downed: boolean,
  p2Energy: number,
  p2Max: number,
  p2Downed: boolean,
  wood: number,
  iron: number,
  maxWood?: number,
  maxIron?: number
): string {
  const p1Str = p1Downed ? "💀 P1 DOWNED" : `⚡ P1: ${Math.max(0, Math.floor(p1Energy))}/${Math.floor(p1Max)}`;
  const p2Str = p2Downed ? "💀 P2 DOWNED" : `⚡ P2: ${Math.max(0, Math.floor(p2Energy))}/${Math.floor(p2Max)}`;
  const w = Math.max(0, Math.floor(wood));
  const i = Math.max(0, Math.floor(iron));
  const mw = maxWood !== undefined ? `/${Math.floor(maxWood)}` : "";
  const mi = maxIron !== undefined ? `/${Math.floor(maxIron)}` : "";
  return `${p1Str}  |  ${p2Str}  |  🪵 Wood: ${w}${mw}  |  ⛏️ Iron: ${i}${mi}`;
}

export function calculateBarFill(current: number, max: number): number {
  if (max <= 0) return 0;
  if (current <= 0) return 0;
  if (current >= max) return 1;
  return current / max;
}

export function canPurchaseUpgrade(upgradeCost: number, availableSpoils: number, alreadyUnlocked: boolean): boolean {
  if (alreadyUnlocked) return false;
  return availableSpoils >= upgradeCost;
}
