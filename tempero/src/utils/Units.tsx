type UnitsSystem = 'metric' | 'imperial' | 'neutral';
type UnitKind = 'volume' | 'mass' | 'count';

export type Unit = {
  name: string;
  system: UnitsSystem;
  kind: UnitKind;
  base: string;
  /** multiply amount * factorToBase to convert to base */
  factorToBase: number;
  /** divide baseAmount / factorToBase to convert from base */
  factorFromBase: number;
};

export const Units: Unit[] = [
  // MASS (base: g)
  { name: 'g',  system: 'metric',   kind: 'mass', base: 'g',  factorToBase: 1,        factorFromBase: 1 },
  { name: 'kg', system: 'metric',   kind: 'mass', base: 'g',  factorToBase: 1000,     factorFromBase: 1 / 1000 },
  { name: 'oz', system: 'imperial', kind: 'mass', base: 'g',  factorToBase: 28.3495,  factorFromBase: 1 / 28.3495 },
  { name: 'lb', system: 'imperial', kind: 'mass', base: 'g',  factorToBase: 453.592,  factorFromBase: 1 / 453.592 },

  // VOLUME (base: ml)
  { name: 'ml',   system: 'metric',   kind: 'volume', base: 'ml', factorToBase: 1,        factorFromBase: 1 },
  { name: 'L',    system: 'metric',   kind: 'volume', base: 'ml', factorToBase: 1000,     factorFromBase: 1 / 1000 },
  { name: 'tsp',  system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 4.92892,  factorFromBase: 1 / 4.92892 },
  { name: 'tbsp', system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 14.7868,  factorFromBase: 1 / 14.7868 },
  { name: 'fl oz',system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 29.5735,  factorFromBase: 1 / 29.5735 },
  { name: 'cup',  system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 240,      factorFromBase: 1 / 240 },
  { name: 'pint', system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 473.176,  factorFromBase: 1 / 473.176 },
  { name: 'quart',system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 946.353,  factorFromBase: 1 / 946.353 },
  { name: 'gal',  system: 'imperial', kind: 'volume', base: 'ml', factorToBase: 3785.41,  factorFromBase: 1 / 3785.41 },


  // COUNT (no conversion)
  { name: 'piece',   system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
  { name: 'slice',   system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
  { name: 'clove',   system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
  { name: 'pinch',   system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
  { name: 'dash',    system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
  { name: 'handful', system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
  { name: 'bunch',   system: 'neutral', kind: 'count', base: 'piece', factorToBase: 1, factorFromBase: 1 },
];

export const getUnit = (name: string) =>
  Units.find(u => u.name === name);

export function toBase(amount: number, unitName: string): number {
  const unit = getUnit(unitName);
  if (!unit) throw new Error('Unknown unit: ' + unitName);
  return amount * unit.factorToBase;
}

export function fromBase(baseAmount: number, unitName: string): number {
  const unit = getUnit(unitName);
  if (!unit) throw new Error('Unknown unit: ' + unitName);
  return baseAmount * unit.factorFromBase;
}

export function convertAmountToSystem(
  amount: number,
  unitName: string,
  targetSystem: UnitsSystem
): { amount: number; unit: Unit } {
  const fromUnit = getUnit(unitName);
  if (!fromUnit) {
    throw new Error('Unknown unit: ' + unitName);
  }

  // Neutral units (piece, slice, etc.) → no conversion
  if (fromUnit.system === 'neutral' || fromUnit.kind === 'count') {
    return { amount, unit: fromUnit };
  }

  // Already in the correct system → keep as is
  if (fromUnit.system === targetSystem) {
    return { amount, unit: fromUnit };
  }

  // 1) convert to base (g, ml, °C)
  const baseAmount = toBase(amount, unitName);

  // 2) get candidate units in target system & same kind
  const candidates = Units.filter(
    u => u.system === targetSystem && u.kind === fromUnit.kind
  );
  if (candidates.length === 0) {
    // no equivalent units → fall back to original
    return { amount, unit: fromUnit };
  }

  // 3) pick a "nice" unit:
  // preference: value >= 1 and as close to 1 as possible
  let bestUnit = candidates[0];
  let bestAmount = fromBase(baseAmount, bestUnit.name);

  for (const u of candidates) {
    const value = fromBase(baseAmount, u.name);
    // prefer values >= 1, and among those, the smallest
    const isBetter =
      (value >= 1 && (bestAmount < 1 || value < bestAmount)) ||
      // if all < 1, choose the largest (closer to 1)
      (value < 1 && value > bestAmount && bestAmount < 1);

    if (isBetter) {
      bestUnit = u;
      bestAmount = value;
    }
  }

  return { amount: bestAmount, unit: bestUnit };
}