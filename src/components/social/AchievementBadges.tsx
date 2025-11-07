import { Trophy, Award, Star, Zap, Crown, Target, Flame, Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Achievement } from '@/hooks/useUserAchievements';

interface AchievementBadgesProps {
  achievements: Achievement[];
  loading?: boolean;
}

const iconMap: Record<string, any> = {
  'trophy': Trophy,
  'award': Award,
  'star': Star,
  'zap': Zap,
  'crown': Crown,
  'target': Target,
  'flame': Flame,
  'medal': Medal,
};

const rarityColors: Record<string, string> = {
  'common': 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
  'rare': 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700',
  'epic': 'bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700',
  'legendary': 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700',
};

const rarityTextColors: Record<string, string> = {
  'common': 'text-slate-600 dark:text-slate-300',
  'rare': 'text-blue-600 dark:text-blue-300',
  'epic': 'text-purple-600 dark:text-purple-300',
  'legendary': 'text-amber-600 dark:text-amber-300',
};

export const AchievementBadges = ({ achievements, loading }: AchievementBadgesProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No achievements unlocked yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Keep working out to earn badges!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => {
        const IconComponent = iconMap[achievement.badge_icon || 'trophy'] || Trophy;
        const rarityClass = rarityColors[achievement.rarity_level] || rarityColors.common;
        const rarityTextClass = rarityTextColors[achievement.rarity_level] || rarityTextColors.common;

        return (
          <Card
            key={achievement.id}
            className={`${rarityClass} border-2 transition-all hover:scale-105 cursor-pointer`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${rarityTextClass} bg-background/50`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm line-clamp-1">
                      {achievement.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {achievement.rarity_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      +{achievement.coins_earned || achievement.coin_reward} coins
                    </span>
                    {achievement.unlocked_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(achievement.unlocked_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
