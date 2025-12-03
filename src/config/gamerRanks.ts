export interface GamerRank {
  level: number;
  title: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
  xpPerLevel: number;
  color: string;
  gradient: string;
}

export const GAMER_RANKS: GamerRank[] = [
  { level: 1, title: 'Mark I: Prototype', icon: '🔩', minLevel: 1, maxLevel: 5, xpPerLevel: 500, color: 'text-slate-400', gradient: 'from-slate-500 to-slate-600' },
  { level: 6, title: 'Mark II: Iron Frame', icon: '⚙️', minLevel: 6, maxLevel: 10, xpPerLevel: 750, color: 'text-yellow-500', gradient: 'from-yellow-500 to-yellow-600' },
  { level: 11, title: 'Mark III: Steel Core', icon: '🛡️', minLevel: 11, maxLevel: 15, xpPerLevel: 1000, color: 'text-orange-400', gradient: 'from-orange-400 to-amber-500' },
  { level: 16, title: 'Mark IV: Titanium Shell', icon: '🔧', minLevel: 16, maxLevel: 20, xpPerLevel: 1250, color: 'text-red-500', gradient: 'from-red-500 to-red-600' },
  { level: 21, title: 'Mark V: Pulse Armor', icon: '⚡', minLevel: 21, maxLevel: 25, xpPerLevel: 1500, color: 'text-rose-500', gradient: 'from-rose-500 to-rose-600' },
  { level: 26, title: 'Mark VI: Nano Tech', icon: '🧬', minLevel: 26, maxLevel: 30, xpPerLevel: 2000, color: 'text-purple-500', gradient: 'from-purple-500 to-purple-600' },
  { level: 31, title: 'Mark VII: Quantum Suit', icon: '💠', minLevel: 31, maxLevel: 35, xpPerLevel: 2500, color: 'text-indigo-500', gradient: 'from-indigo-500 to-indigo-600' },
  { level: 36, title: 'Mark VIII: Vibranium Edge', icon: '🔷', minLevel: 36, maxLevel: 40, xpPerLevel: 3000, color: 'text-blue-500', gradient: 'from-blue-500 to-blue-600' },
  { level: 41, title: 'Mark IX: Cosmic Forge', icon: '✨', minLevel: 41, maxLevel: 45, xpPerLevel: 4000, color: 'text-cyan-400', gradient: 'from-cyan-400 to-blue-500' },
  { level: 46, title: 'Mark X: Omega Prime', icon: '👑', minLevel: 46, maxLevel: 50, xpPerLevel: 5000, color: 'text-amber-400', gradient: 'from-amber-400 to-yellow-500' },
];

export const PRESTIGE_COLORS = [
  { level: 0, color: 'border-slate-500', badge: '', name: '' },
  { level: 1, color: 'border-yellow-500', badge: '⚡', name: 'Stealth Variant' },
  { level: 2, color: 'border-orange-500', badge: '🔥', name: 'Combat Variant' },
  { level: 3, color: 'border-red-500', badge: '💀', name: 'War Machine' },
  { level: 4, color: 'border-purple-500', badge: '🔥🔥', name: 'Iron Legion' },
  { level: 5, color: 'border-indigo-500', badge: '💠', name: 'Hulkbuster' },
  { level: 6, color: 'border-blue-500', badge: '💠💠', name: 'Bleeding Edge' },
  { level: 7, color: 'border-cyan-500', badge: '🔷', name: 'Endo-Sym' },
  { level: 8, color: 'border-emerald-500', badge: '🔷🔷', name: 'Superior Iron' },
  { level: 9, color: 'border-pink-500', badge: '💎', name: 'Godbuster' },
  { level: 10, color: 'border-amber-400 shadow-amber-400/50', badge: '🌟', name: 'Celestial Armor' },
];

export const getRankForLevel = (level: number): GamerRank => {
  for (let i = GAMER_RANKS.length - 1; i >= 0; i--) {
    if (level >= GAMER_RANKS[i].minLevel) {
      return GAMER_RANKS[i];
    }
  }
  return GAMER_RANKS[0];
};

export const getPrestigeInfo = (prestigeLevel: number) => {
  return PRESTIGE_COLORS[Math.min(prestigeLevel, PRESTIGE_COLORS.length - 1)];
};

export const getXpForLevel = (level: number): number => {
  const rank = getRankForLevel(level);
  return rank.xpPerLevel;
};

export const XP_ACTIONS = {
  WORKOUT_COMPLETE: 100,
  MEAL_LOGGED: 25,
  MEAL_WITH_PHOTO: 35,
  WATER_GOAL_HIT: 30,
  CALORIE_GOAL_HIT: 40,
  PROTEIN_GOAL_HIT: 40,
  BODY_SCAN: 75,
  PERSONAL_RECORD: 100,
  STREAK_3_DAY: 50,
  STREAK_7_DAY: 200,
  STREAK_14_DAY: 500,
  STREAK_30_DAY: 1000,
  FIRST_WORKOUT_OF_DAY: 50,
  CHALLENGE_COMPLETE: 150,
} as const;
