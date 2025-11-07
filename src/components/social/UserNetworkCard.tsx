import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserWithStats } from '@/services/socialService';
import { useNavigate } from 'react-router-dom';
import { Flame, Dumbbell, Clock } from 'lucide-react';
import { getDisplayName } from '@/lib/userDisplay';

interface UserNetworkCardProps {
  user: UserWithStats;
  showFollowButton?: boolean;
  onFollowToggle?: () => void;
  isFollowing?: boolean;
  actionLoading?: boolean;
}

export function UserNetworkCard({ 
  user, 
  showFollowButton = false,
  onFollowToggle,
  isFollowing = false,
  actionLoading = false
}: UserNetworkCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (user.username) {
      navigate(`/profile/${user.username}`);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = getDisplayName(null, user);

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {getInitials(displayName || user.username)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {displayName || user.username || 'Unknown User'}
                </h3>
                {user.username && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
              </div>

              {showFollowButton && onFollowToggle && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollowToggle();
                  }}
                  disabled={actionLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}

            {user.workout_stats && user.share_workout_stats && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {user.workout_stats.total_calories_burned.toLocaleString()} cal
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  {user.workout_stats.total_workouts} workouts
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {user.workout_stats.total_workout_minutes} min
                </Badge>
              </div>
            )}

            {user.share_workout_stats === false && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Workout stats private
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
