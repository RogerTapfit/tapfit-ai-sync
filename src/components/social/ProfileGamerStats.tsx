import { motion } from 'framer-motion';
import { Coins, Zap, Trophy, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProfileGamerStatsProps {
  stats: {
    total_xp: number;
    current_level: number;
    prestige_level: number;
    rank_title: string;
    rank_icon: string;
    current_level_xp: number;
    xp_to_next_level: number;
  } | null;
  tapCoins: number;
  tapTokens?: number;
  progressPercentage: number;
}

export const ProfileGamerStats = ({
  stats,
  tapCoins,
  tapTokens = 0,
  progressPercentage
}: ProfileGamerStatsProps) => {
  if (!stats) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
        <div className="text-center text-muted-foreground">
          No gamer stats yet
        </div>
      </div>
    );
  }

  const getRankColor = (level: number) => {
    if (level <= 5) return '#94a3b8'; // slate
    if (level <= 10) return '#eab308'; // yellow
    if (level <= 15) return '#f97316'; // orange
    if (level <= 20) return '#ef4444'; // red
    if (level <= 25) return '#8b5cf6'; // violet
    if (level <= 30) return '#06b6d4'; // cyan
    if (level <= 35) return '#3b82f6'; // blue
    if (level <= 40) return '#6366f1'; // indigo
    if (level <= 45) return '#a855f7'; // purple
    return '#fbbf24'; // gold
  };

  const rankColor = getRankColor(stats.current_level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/50"
    >
      {/* Rank Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="text-3xl p-2 rounded-lg"
            style={{ backgroundColor: `${rankColor}20` }}
          >
            {stats.rank_icon}
          </div>
          <div>
            <h3 
              className="font-bold text-lg"
              style={{ color: rankColor }}
            >
              {stats.rank_title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Level {stats.current_level}
              {stats.prestige_level > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs"
                  style={{ backgroundColor: `${rankColor}30`, color: rankColor }}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Prestige {stats.prestige_level}
                </Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">XP Progress</span>
          <span className="font-medium">
            {stats.current_level_xp.toLocaleString()} / {stats.xp_to_next_level.toLocaleString()}
          </span>
        </div>
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                background: `linear-gradient(90deg, ${rankColor}, ${rankColor}cc)`
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-lg font-bold text-foreground">
            {stats.total_xp.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <Coins className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <p className="text-lg font-bold text-foreground">
            {tapCoins.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Tap Coins</p>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <p className="text-lg font-bold text-foreground">
            {tapTokens.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Tap Tokens</p>
        </div>
      </div>
    </motion.div>
  );
};
