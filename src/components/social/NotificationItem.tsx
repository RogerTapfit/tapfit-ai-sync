import { formatDistanceToNow } from 'date-fns';
import { Trophy, Award, TrendingUp, UserPlus, Flame, Footprints, Waves, Bike } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Notification } from '@/services/notificationService';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();

  const getCardioIcon = (activityType: string) => {
    switch (activityType) {
      case 'walk':
        return <Footprints className="h-4 w-4 text-emerald-500" />;
      case 'run':
        return <Footprints className="h-4 w-4 text-primary" />;
      case 'swim':
        return <Waves className="h-4 w-4 text-sky-500" />;
      case 'ride':
        return <Bike className="h-4 w-4 text-orange-500" />;
      default:
        return <Footprints className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case 'new_follower':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'pr_achievement':
        return <Trophy className="h-4 w-4 text-primary" />;
      case 'achievement_unlocked':
        return <Award className="h-4 w-4 text-accent" />;
      case 'workout_milestone':
        return <TrendingUp className="h-4 w-4 text-secondary" />;
      case 'streak_milestone':
        return <Flame className="h-4 w-4 text-destructive" />;
      case 'cardio_completed':
        return getCardioIcon(notification.notification_data?.activity_type);
      default:
        return null;
    }
  };

  const formatCardioText = (data: any, actorName: string) => {
    const activityType = data.activity_type || 'activity';
    const activityLabel = activityType.charAt(0).toUpperCase() + activityType.slice(1);
    
    let details = '';
    if (activityType === 'swim') {
      details = `${data.laps || 0} laps in ${data.duration_min || 0} min`;
    } else if (activityType === 'ride') {
      details = `${data.distance_km || 0} km in ${data.duration_min || 0} min`;
    } else {
      details = `${data.distance_km || 0} km in ${data.duration_min || 0} min`;
    }
    
    return `${actorName} completed a ${activityLabel}: ${details}`;
  };

  const getNotificationText = () => {
    const data = notification.notification_data;
    const actorName = notification.actor?.username || notification.actor?.full_name || 'Someone';

    switch (notification.notification_type) {
      case 'new_follower':
        return `${actorName} started following you`;
      case 'pr_achievement':
        return `${actorName} set a new PR: ${data.weight_lbs} lbs on ${data.machine_name}`;
      case 'achievement_unlocked':
        return `${actorName} unlocked "${data.achievement_name}"`;
      case 'workout_milestone':
        return `${actorName} reached ${data.milestone} workouts!`;
      case 'streak_milestone':
        return `${actorName} achieved a ${data.days} day streak!`;
      case 'cardio_completed':
        return formatCardioText(data, actorName);
      default:
        return 'New activity';
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

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
    
    if (notification.actor?.username) {
      navigate(`/profile/${notification.actor.username}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "w-full p-3 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border",
        !notification.read && "bg-accent/20"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={notification.actor?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(notification.actor?.full_name || notification.actor?.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            {getNotificationIcon()}
            <p className="text-sm font-medium leading-tight">
              {getNotificationText()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
