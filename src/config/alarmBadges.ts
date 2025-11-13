export interface AlarmBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  category: 'streak' | 'completion' | 'speed' | 'consistency';
  requirement: {
    type: 'streak' | 'total_completions' | 'speed' | 'early_bird' | 'weekend_warrior';
    value: number;
  };
  coinReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const alarmBadges: AlarmBadge[] = [
  // Streak Badges
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete alarms 7 days in a row',
    icon: '🔥',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    coinReward: 100,
    rarity: 'common',
  },
  {
    id: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Complete alarms 14 days in a row',
    icon: '🔥🔥',
    color: 'red',
    gradient: 'from-red-500 to-rose-600',
    category: 'streak',
    requirement: { type: 'streak', value: 14 },
    coinReward: 250,
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Complete alarms 30 days in a row',
    icon: '🔥🔥🔥',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    coinReward: 500,
    rarity: 'epic',
  },
  {
    id: 'streak_100',
    name: 'Century Champion',
    description: 'Complete alarms 100 days in a row',
    icon: '👑',
    color: 'yellow',
    gradient: 'from-yellow-400 to-orange-500',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
    coinReward: 2000,
    rarity: 'legendary',
  },

  // Completion Count Badges
  {
    id: 'total_10',
    name: 'Getting Started',
    description: 'Complete 10 alarms total',
    icon: '🎯',
    color: 'blue',
    gradient: 'from-blue-400 to-cyan-500',
    category: 'completion',
    requirement: { type: 'total_completions', value: 10 },
    coinReward: 50,
    rarity: 'common',
  },
  {
    id: 'total_50',
    name: 'Half Century',
    description: 'Complete 50 alarms total',
    icon: '🎖️',
    color: 'green',
    gradient: 'from-green-400 to-emerald-500',
    category: 'completion',
    requirement: { type: 'total_completions', value: 50 },
    coinReward: 200,
    rarity: 'rare',
  },
  {
    id: 'total_100',
    name: 'Centurion',
    description: 'Complete 100 alarms total',
    icon: '🏆',
    color: 'amber',
    gradient: 'from-amber-400 to-orange-500',
    category: 'completion',
    requirement: { type: 'total_completions', value: 100 },
    coinReward: 500,
    rarity: 'epic',
  },
  {
    id: 'total_500',
    name: 'Legendary Riser',
    description: 'Complete 500 alarms total',
    icon: '💎',
    color: 'cyan',
    gradient: 'from-cyan-400 to-blue-600',
    category: 'completion',
    requirement: { type: 'total_completions', value: 500 },
    coinReward: 2500,
    rarity: 'legendary',
  },

  // Speed Badges
  {
    id: 'speed_60',
    name: 'Speed Demon',
    description: 'Complete an alarm in under 60 seconds',
    icon: '⚡',
    color: 'yellow',
    gradient: 'from-yellow-300 to-amber-400',
    category: 'speed',
    requirement: { type: 'speed', value: 60 },
    coinReward: 150,
    rarity: 'rare',
  },
  {
    id: 'speed_30',
    name: 'Lightning Fast',
    description: 'Complete an alarm in under 30 seconds',
    icon: '⚡⚡',
    color: 'purple',
    gradient: 'from-purple-400 to-fuchsia-500',
    category: 'speed',
    requirement: { type: 'speed', value: 30 },
    coinReward: 300,
    rarity: 'epic',
  },
  {
    id: 'speed_15',
    name: 'Superhuman',
    description: 'Complete an alarm in under 15 seconds',
    icon: '🚀',
    color: 'pink',
    gradient: 'from-pink-400 to-rose-600',
    category: 'speed',
    requirement: { type: 'speed', value: 15 },
    coinReward: 1000,
    rarity: 'legendary',
  },

  // Consistency Badges
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 20 alarms before 7 AM',
    icon: '🌅',
    color: 'sky',
    gradient: 'from-sky-400 to-blue-500',
    category: 'consistency',
    requirement: { type: 'early_bird', value: 20 },
    coinReward: 200,
    rarity: 'rare',
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 alarms on weekends',
    icon: '🎉',
    color: 'violet',
    gradient: 'from-violet-400 to-purple-500',
    category: 'consistency',
    requirement: { type: 'weekend_warrior', value: 10 },
    coinReward: 150,
    rarity: 'rare',
  },
];

export const getBadgesByCategory = (category: AlarmBadge['category']) => {
  return alarmBadges.filter(badge => badge.category === category);
};

export const getBadgeById = (id: string) => {
  return alarmBadges.find(badge => badge.id === id);
};

export const getRarityColor = (rarity: AlarmBadge['rarity']) => {
  switch (rarity) {
    case 'common':
      return 'text-slate-400';
    case 'rare':
      return 'text-blue-400';
    case 'epic':
      return 'text-purple-400';
    case 'legendary':
      return 'text-amber-400';
  }
};
