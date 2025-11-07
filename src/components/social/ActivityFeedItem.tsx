import { formatDistanceToNow } from 'date-fns';
import { Trophy, Award, TrendingUp, Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ActivityFeedItem as ActivityFeedItemType } from '@/services/activityFeedService';
import { useNavigate } from 'react-router-dom';
import { ReactionButtons } from './ReactionButtons';
import { TargetType } from '@/hooks/useActivityReactions';

interface ActivityFeedItemProps {
  activity: ActivityFeedItemType;
}

export const ActivityFeedItem = ({ activity }: ActivityFeedItemProps) => {
  const navigate = useNavigate();
  
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'pr':
        return <Trophy className="h-5 w-5 text-primary" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-accent" />;
      case 'workout_milestone':
        return <TrendingUp className="h-5 w-5 text-secondary" />;
      case 'streak_milestone':
        return <Flame className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getActivityText = () => {
    const data = activity.activity_data;
    
    switch (activity.activity_type) {
      case 'pr':
        return (
          <>
            <span className="font-semibold">set a new PR</span> on {data.machine_name}:{' '}
            <span className="text-primary font-bold">{data.weight_lbs} lbs</span> x {data.reps} reps
            {data.improvement_percentage && (
              <span className="text-muted-foreground text-sm ml-2">
                (+{data.improvement_percentage.toFixed(1)}%)
              </span>
            )}
          </>
        );
      case 'achievement':
        return (
          <>
            <span className="font-semibold">unlocked achievement:</span>{' '}
            <span className="text-accent">{data.achievement_name}</span>
            {data.coins_earned > 0 && (
              <span className="text-muted-foreground text-sm ml-2">
                +{data.coins_earned} coins
              </span>
            )}
          </>
        );
      case 'workout_milestone':
        return (
          <>
            <span className="font-semibold">reached a milestone:</span>{' '}
            <span className="text-secondary font-bold">{data.milestone} workouts completed!</span>
          </>
        );
      case 'streak_milestone':
        return (
          <>
            <span className="font-semibold">achieved a streak:</span>{' '}
            <span className="text-destructive font-bold">{data.days} day workout streak!</span>
          </>
        );
      default:
        return 'completed an activity';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    if (activity.profile?.username) {
      navigate(`/profile/${activity.profile.username}`);
    }
  };

  return (
    <Card className="p-3 sm:p-4 hover:shadow-md hover:shadow-purple-500/10 transition-all border-border hover:border-purple-500/30">
      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
        <div className="flex-shrink-0">
          <Avatar 
            className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-purple-500/20"
            onClick={handleProfileClick}
          >
            <AvatarImage src={activity.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-xs sm:text-sm">
              {getInitials(activity.profile?.full_name || activity.profile?.username)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {getActivityIcon()}
            <button
              onClick={handleProfileClick}
              className="font-semibold hover:underline text-foreground text-sm sm:text-base truncate"
            >
              {activity.profile?.username || activity.profile?.full_name || 'User'}
            </button>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
            {getActivityText()}
          </p>

          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
            
            <ReactionButtons 
              targetType={activity.activity_type === 'pr' ? 'pr' : activity.activity_type === 'achievement' ? 'achievement' : 'workout' as TargetType}
              targetId={activity.reference_id}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
