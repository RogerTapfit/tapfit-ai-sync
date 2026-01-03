export interface FastingProtocol {
  id: string;
  name: string;
  fastHours: number;
  eatHours: number;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  benefits: string[];
  icon: string;
  allowedItems?: string[];
  isMultiDay?: boolean;
  minDays?: number;
  maxDays?: number;
}

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  {
    id: '16:8',
    name: '16:8 Intermittent',
    fastHours: 16,
    eatHours: 8,
    description: 'Fast 16 hours, eat within 8-hour window',
    difficulty: 'beginner',
    benefits: ['Weight loss', 'Improved insulin sensitivity', 'Easy to maintain'],
    icon: '🕐'
  },
  {
    id: '18:6',
    name: '18:6 Intermittent',
    fastHours: 18,
    eatHours: 6,
    description: 'Fast 18 hours, eat within 6-hour window',
    difficulty: 'intermediate',
    benefits: ['Enhanced autophagy', 'Greater fat burning', 'Mental clarity'],
    icon: '⏰'
  },
  {
    id: '20:4',
    name: '20:4 Warrior Diet',
    fastHours: 20,
    eatHours: 4,
    description: 'Fast 20 hours, eat within 4-hour window',
    difficulty: 'advanced',
    benefits: ['Maximum autophagy', 'Deep ketosis', 'Cellular renewal'],
    icon: '⚔️'
  },
  {
    id: 'OMAD',
    name: 'One Meal A Day',
    fastHours: 23,
    eatHours: 1,
    description: 'Eat one large meal per day',
    difficulty: 'advanced',
    benefits: ['Simplicity', 'Maximum fasting benefits', 'Time savings'],
    icon: '🍽️'
  },
  {
    id: 'alternate_day',
    name: 'Alternate Day Fasting',
    fastHours: 36,
    eatHours: 12,
    description: 'Fast every other day (36 hours)',
    difficulty: 'advanced',
    benefits: ['Significant weight loss', 'Longevity benefits', 'Metabolic reset'],
    icon: '📅'
  },
  {
    id: 'extended',
    name: 'Extended Fast',
    fastHours: 48,
    eatHours: 0,
    description: 'Multi-day fast (2-7 days)',
    difficulty: 'expert',
    benefits: ['Deep autophagy', 'Stem cell regeneration', 'Immune reset', 'Maximum metabolic benefits'],
    icon: '🗓️',
    isMultiDay: true,
    minDays: 2,
    maxDays: 7
  },
  {
    id: 'water_fast',
    name: 'Water Fast',
    fastHours: 24,
    eatHours: 0,
    description: 'Water only for 24+ hours',
    difficulty: 'expert',
    benefits: ['Deep autophagy', 'Immune system reset', 'Mental clarity'],
    icon: '💧',
    allowedItems: ['Water', 'Electrolytes']
  },
  {
    id: 'liquid_fast',
    name: 'Liquid Fast',
    fastHours: 24,
    eatHours: 0,
    description: 'Liquids only (broths, juices) for 24+ hours',
    difficulty: 'intermediate',
    benefits: ['Gut rest', 'Hydration', 'Easier than water fast'],
    icon: '🥤',
    allowedItems: ['Water', 'Bone broth', 'Vegetable juice', 'Tea', 'Black coffee']
  },
  {
    id: 'custom',
    name: 'Custom Fast',
    fastHours: 0,
    eatHours: 0,
    description: 'Set your own fasting duration',
    difficulty: 'intermediate',
    benefits: ['Flexibility', 'Personal optimization'],
    icon: '⚙️'
  }
];

export interface FastingMilestone {
  hours: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const FASTING_MILESTONES: FastingMilestone[] = [
  { hours: 4, name: 'Blood sugar drops', description: 'Insulin levels decrease, body starts using stored glucose', icon: '📉', color: 'text-blue-400' },
  { hours: 8, name: 'Glycogen depletion begins', description: 'Liver glycogen stores being used up', icon: '🔋', color: 'text-yellow-400' },
  { hours: 12, name: 'Entering ketosis', description: 'Body begins producing ketones for fuel', icon: '🔥', color: 'text-orange-400' },
  { hours: 16, name: 'Fat burning zone', description: 'Significant fat oxidation, autophagy beginning', icon: '🏃', color: 'text-green-400' },
  { hours: 18, name: 'Autophagy activated', description: 'Cells begin recycling damaged components', icon: '♻️', color: 'text-emerald-400' },
  { hours: 24, name: 'Deep autophagy', description: 'Maximum cellular cleanup and repair', icon: '✨', color: 'text-purple-400' },
  { hours: 36, name: 'Growth hormone surge', description: 'HGH increases up to 5x baseline', icon: '💪', color: 'text-pink-400' },
  { hours: 48, name: 'Immune cell regeneration', description: 'Old immune cells recycled, new ones produced', icon: '🛡️', color: 'text-cyan-400' },
  { hours: 72, name: 'Stem cell activation', description: 'Body activates stem cells for regeneration', icon: '🧬', color: 'text-indigo-400' },
];

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return 'text-green-400';
    case 'intermediate': return 'text-yellow-400';
    case 'advanced': return 'text-orange-400';
    case 'expert': return 'text-red-400';
    default: return 'text-muted-foreground';
  }
};

export const getProtocolById = (id: string): FastingProtocol | undefined => {
  return FASTING_PROTOCOLS.find(p => p.id === id);
};
