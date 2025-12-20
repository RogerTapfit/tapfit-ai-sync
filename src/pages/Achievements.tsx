import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamerRank } from '@/hooks/useGamerRank';
import { useGamerAchievements, GamerAchievement } from '@/hooks/useGamerAchievements';
import { getRankForLevel, getPrestigeInfo, GAMER_RANKS } from '@/config/gamerRanks';
import { Trophy, Zap, Lock, Droplets, Apple, Dumbbell, Flame, Star, Coins } from 'lucide-react';
import { usePageContext } from '@/hooks/usePageContext';
import { PageHeader } from '@/components/PageHeader';

const CATEGORY_INFO = {
  hydration: { icon: Droplets, label: 'Hydration', color: 'text-blue-500' },
  nutrition: { icon: Apple, label: 'Nutrition', color: 'text-green-500' },
  workout: { icon: Dumbbell, label: 'Workout', color: 'text-orange-500' },
  streak: { icon: Flame, label: 'Streaks', color: 'text-red-500' },
  special: { icon: Star, label: 'Special', color: 'text-purple-500' },
};

const RARITY_COLORS = {
  common: 'border-slate-400 bg-slate-500/10',
  rare: 'border-blue-400 bg-blue-500/10',
  epic: 'border-purple-400 bg-purple-500/10',
  legendary: 'border-amber-400 bg-amber-500/10 shadow-amber-400/20 shadow-lg',
  mythic: 'border-pink-400 bg-pink-500/10 shadow-pink-400/30 shadow-xl animate-pulse',
};

export default function Achievements() {
  const { stats, loading: statsLoading, getProgressPercentage } = useGamerRank();
  const { achievements, userAchievements, loading: achievementsLoading, isUnlocked, getUnlockedCount } = useGamerAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Register page context for chatbot
  usePageContext({
    pageName: 'Achievements & Rank',
    pageDescription: 'View your gamer rank progression and unlocked achievements',
    visibleContent: stats ? `Current Rank: ${stats.rank_title} (Level ${stats.current_level}), Total XP: ${stats.total_xp}, Achievements Unlocked: ${getUnlockedCount()}/${achievements.length}, Prestige Level: ${stats.prestige_level}` : 'Loading achievements...'
  });

  if (statsLoading || achievementsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageHeader title="Achievements & Rank" />
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const rank = stats ? getRankForLevel(stats.current_level) : GAMER_RANKS[0];
  const prestige = stats ? getPrestigeInfo(stats.prestige_level) : getPrestigeInfo(0);
  const progress = getProgressPercentage();

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getUnlockDate = (achievementId: string) => {
    const ua = userAchievements.find(u => u.achievement_id === achievementId);
    return ua?.unlocked_at ? new Date(ua.unlocked_at).toLocaleDateString() : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Achievements & Rank" />
      
      <div className="p-4 space-y-6">

      {/* Rank Card */}
      {stats && (
        <Card className={`relative overflow-hidden border-2 ${prestige.color}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${rank.gradient} opacity-10`} />
          
          <div className="relative p-6 space-y-4">
            {/* Rank Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="text-6xl">{stats.rank_icon}</span>
                  {stats.prestige_level > 0 && (
                    <span className="absolute -top-1 -right-1 text-xl">{prestige.badge}</span>
                  )}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${rank.color}`}>{stats.rank_title}</h2>
                  <p className="text-lg text-muted-foreground">Level {stats.current_level}</p>
                  {stats.prestige_level > 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-500 mt-1">
                      Prestige {stats.prestige_level}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                  <Zap className="h-6 w-6" />
                  {stats.total_xp.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {Math.min(stats.current_level + 1, 50)}</span>
                <span>{stats.current_level_xp.toLocaleString()} / {stats.xp_to_next_level.toLocaleString()} XP</span>
              </div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${rank.gradient} rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold">{getUnlockedCount()}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.current_level}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.prestige_level}</p>
                <p className="text-xs text-muted-foreground">Prestige</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Rank Progression */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Rank Progression
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {GAMER_RANKS.map((r) => (
            <div 
              key={r.title}
              className={`flex-shrink-0 p-3 rounded-lg border-2 text-center min-w-[80px] ${
                stats && stats.current_level >= r.minLevel
                  ? `border-primary bg-primary/10`
                  : 'border-border bg-muted/30 opacity-50'
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <p className="text-xs font-medium mt-1">{r.title}</p>
              <p className="text-xs text-muted-foreground">Lv {r.minLevel}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Achievements ({getUnlockedCount()} / {achievements.length})
        </h3>

        {/* Category Tabs */}
        <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary">
              All
            </TabsTrigger>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary">
                  <Icon className={`h-4 w-4 mr-1 ${info.color}`} />
                  {info.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const unlockDate = getUnlockDate(achievement.id);
            
            return (
              <Card
                key={achievement.id}
                className={`p-4 transition-all ${RARITY_COLORS[achievement.rarity]} ${
                  !unlocked ? 'opacity-60 grayscale' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Badge */}
                  <div className={`text-4xl ${!unlocked ? 'opacity-40' : ''}`}>
                    {unlocked ? achievement.badge_emoji : '🔒'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold truncate">{achievement.name}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                    
                    {/* Rewards */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        +{achievement.xp_reward} XP
                      </span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <Coins className="h-3 w-3" />
                        +{achievement.coin_reward}
                      </span>
                    </div>
                    
                    {/* Unlock Date */}
                    {unlocked && unlockDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Unlocked {unlockDate}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
