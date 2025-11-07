export type LevelDef = {
  level: number;
  name: string;
  minXp: number;
  maxXp: number; // inclusive
};

const LEVELS: LevelDef[] = [
  { level: 1, name: "New cook", minXp: 0, maxXp: 19 },
  { level: 2, name: "Junior Coock", minXp: 20, maxXp: 39 },
  { level: 3, name: "Home Chef", minXp: 40, maxXp: 59 },
  { level: 4, name: "Sous Chef", minXp: 60, maxXp: 79 },
  { level: 5, name: "Star Chef", minXp: 80, maxXp: 100 },
];

export function getLevelInfo(xp: number) {
  const xpClamped = Math.max(0, Math.floor(xp || 0));
  const def =
    LEVELS.find((l) => xpClamped >= l.minXp && xpClamped <= l.maxXp) ??
    LEVELS[LEVELS.length - 1];

  const intoLevel = xpClamped - def.minXp;
  const levelRange =
    def.maxXp === Number.POSITIVE_INFINITY ? null : def.maxXp - def.minXp + 1;
  const progress = levelRange ? Math.min(1, intoLevel / levelRange) : 1;

  return {
    level: def.level,
    name: def.name,
    xp: xpClamped,
    minXp: def.minXp,
    maxXp: def.maxXp === Number.POSITIVE_INFINITY ? null : def.maxXp,
    progress,
  };
}

export { LEVELS };