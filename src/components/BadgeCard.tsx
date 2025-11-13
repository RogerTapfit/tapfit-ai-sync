import { Card } from '@/components/ui/card';
import { type AlarmBadge } from '@/config/alarmBadges';
import { Lock } from 'lucide-react';

interface BadgeCardProps {
  badge: AlarmBadge;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export const BadgeCard = ({ badge, isUnlocked, unlockedAt }: BadgeCardProps) => {
  const getRarityBorder = () => {
    switch (badge.rarity) {
      case 'common':
        return 'border-slate-400/30';
      case 'rare':
        return 'border-blue-400/40';
      case 'epic':
        return 'border-purple-400/50';
      case 'legendary':
        return 'border-amber-400/60 shadow-amber-400/20 shadow-lg';
      default:
        return 'border-border';
    }
  };

  const getRarityLabel = () => {
    return badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1);
  };

  return (
    <Card
      className={`p-4 transition-all ${getRarityBorder()} ${
        isUnlocked
          ? 'bg-gradient-to-br from-card to-accent/30'
          : 'bg-muted/30 opacity-60'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        {/* Badge Icon */}
        <div
          className={`text-6xl relative ${
            !isUnlocked ? 'filter grayscale opacity-40' : ''
          }`}
        >
          {isUnlocked ? (
            <div className={`bg-gradient-to-br ${badge.gradient} bg-clip-text text-transparent`}>
              {badge.icon}
            </div>
          ) : (
            <div className="relative">
              {badge.icon}
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="space-y-1 w-full">
          <h3 className={`font-bold text-lg ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
            {badge.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {badge.description}
          </p>
        </div>

        {/* Rarity & Reward */}
        <div className="flex items-center justify-between w-full text-xs">
          <span className={`px-2 py-1 rounded-full ${
            badge.rarity === 'legendary'
              ? 'bg-amber-500/20 text-amber-400'
              : badge.rarity === 'epic'
              ? 'bg-purple-500/20 text-purple-400'
              : badge.rarity === 'rare'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-500/20 text-slate-400'
          }`}>
            {getRarityLabel()}
          </span>
          <span className={`font-medium ${isUnlocked ? 'text-amber-500' : 'text-muted-foreground'}`}>
            +{badge.coinReward} 💰
          </span>
        </div>

        {/* Unlock Date */}
        {isUnlocked && unlockedAt && (
          <p className="text-xs text-muted-foreground">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}

        {/* Lock Message */}
        {!isUnlocked && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Keep going to unlock!</span>
          </div>
        )}
      </div>
    </Card>
  );
};
