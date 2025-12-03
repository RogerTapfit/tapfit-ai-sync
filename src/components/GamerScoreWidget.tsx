import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGamerRank } from '@/hooks/useGamerRank';
import { useGamerAchievements } from '@/hooks/useGamerAchievements';
import { getRankForLevel, getPrestigeInfo } from '@/config/gamerRanks';
import { Trophy, ChevronRight, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LevelUpAnimation } from './LevelUpAnimation';
import { XPGainToast } from './XPGainToast';

export const GamerScoreWidget = () => {
  const navigate = useNavigate();
  const { stats, loading, getProgressPercentage, lastXPGain, clearLastXPGain, levelUpData, clearLevelUpData } = useGamerRank();
  const { getUnlockedCount, getTotalAchievements, getRecentUnlocks } = useGamerAchievements();

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-24 bg-muted rounded" />
      </Card>
    );
  }

  if (!stats) return null;

  const rank = getRankForLevel(stats.current_level);
  const prestige = getPrestigeInfo(stats.prestige_level);
  const progress = getProgressPercentage();
  const recentAchievements = getRecentUnlocks(3);

  return (
    <>
      {/* XP Gain Toast */}
      {lastXPGain && (
        <XPGainToast
          amount={lastXPGain.amount}
          source={lastXPGain.source}
          currentXP={stats.current_level_xp}
          maxXP={stats.xp_to_next_level}
          onComplete={clearLastXPGain}
        />
      )}

      {/* Level Up Animation */}
      {levelUpData && (
        <LevelUpAnimation
          newLevel={levelUpData.current_level}
          rankTitle={levelUpData.rank_title}
          rankIcon={levelUpData.rank_icon}
          coinsAwarded={levelUpData.coins_awarded}
          prestigeUp={levelUpData.prestige_up}
          prestigeLevel={levelUpData.prestige_level}
          onComplete={clearLevelUpData}
        />
      )}

      <Card 
        className={`relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-2 ${prestige.color}`}
        onClick={() => navigate('/achievements')}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${rank.gradient} opacity-10`} />
        
        <div className="relative p-4 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`text-4xl ${stats.prestige_level > 0 ? 'animate-pulse' : ''}`}>
                  {stats.rank_icon}
                </div>
                {stats.prestige_level > 0 && (
                  <div className="absolute -top-1 -right-1 text-xs">
                    {prestige.badge}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${rank.color}`}>
                    {stats.rank_title}
                  </span>
                  {stats.prestige_level > 0 && (
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
                      P{stats.prestige_level}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Level {stats.current_level}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-bold">{stats.total_xp.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {stats.current_level}</span>
              <span>{stats.current_level_xp.toLocaleString()} / {stats.xp_to_next_level.toLocaleString()} XP</span>
              <span>Level {Math.min(stats.current_level + 1, 50)}</span>
            </div>
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-3 bg-muted"
              />
              <div 
                className={`absolute inset-0 h-3 rounded-full bg-gradient-to-r ${rank.gradient} opacity-80`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Achievements Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">
                {getUnlockedCount()} / {getTotalAchievements()} Achievements
              </span>
            </div>
            
            {/* Recent Achievement Badges */}
            <div className="flex items-center gap-1">
              {recentAchievements.map((ua) => (
                <span 
                  key={ua.id} 
                  className="text-lg" 
                  title={ua.achievement?.name}
                >
                  {ua.achievement?.badge_emoji}
                </span>
              ))}
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};
