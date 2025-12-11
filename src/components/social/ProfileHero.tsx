import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Share2, Eye, EyeOff } from 'lucide-react';
import { RobotAvatarDisplay } from '@/components/RobotAvatarDisplay';

interface ProfileHeroProps {
  profile: {
    id: string;
    username?: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    avatar_id?: string;
    avatar_data?: any;
    is_profile_public?: boolean;
    share_workout_stats?: boolean;
    workout_visibility?: string;
  };
  socialStats: {
    follower_count: number;
    following_count: number;
    workout_count: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  followsBack?: boolean;
  onFollowToggle: () => void;
  rankColor?: string;
}

const getDisplayName = (profile: { full_name?: string; username?: string }) => {
  return profile.full_name || profile.username || 'User';
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const ProfileHero = ({
  profile,
  socialStats,
  isOwnProfile,
  isFollowing,
  followsBack,
  onFollowToggle,
  rankColor = '#6366f1'
}: ProfileHeroProps) => {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${getDisplayName(profile)} on TapFit`,
        url: window.location.href
      });
    }
  };

  return (
    <div className="relative">
      {/* Cover Banner with Rank Gradient */}
      <div 
        className="h-32 sm:h-40 rounded-t-xl"
        style={{
          background: `linear-gradient(135deg, ${rankColor}40, ${rankColor}20, hsl(var(--background)))`
        }}
      />

      {/* Profile Content */}
      <div className="px-4 sm:px-6 pb-4 -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Dual Avatars */}
          <div className="flex items-end gap-2">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || ''} alt={getDisplayName(profile)} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {getInitials(profile.full_name || profile.username || '')}
              </AvatarFallback>
            </Avatar>
            
            {(profile.avatar_data || profile.avatar_id) && (
              <div className="w-12 h-12 sm:w-16 sm:h-16 -ml-4 mb-2 z-10">
                <RobotAvatarDisplay 
                  avatarData={{ ...profile.avatar_data, avatar_id: profile.avatar_id }}
                  size="small"
                  className="border-2 border-background rounded-full shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {getDisplayName(profile)}
              </h1>
              <p className="text-muted-foreground">@{profile.username || 'user'}</p>
              
              {/* Privacy Badges */}
              <div className="flex items-center gap-2 mt-2">
                {profile.is_profile_public ? (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Eye className="w-3 h-3" /> Public
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <EyeOff className="w-3 h-3" /> Private
                  </Badge>
                )}
                {followsBack && !isOwnProfile && (
                  <Badge variant="secondary" className="text-xs">
                    Follows you
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isOwnProfile && (
                <Button
                  onClick={onFollowToggle}
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-foreground/80 max-w-2xl">{profile.bio}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="text-center">
            <span className="font-bold text-lg text-foreground">{socialStats.workout_count}</span>
            <span className="text-muted-foreground ml-1">Workouts</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-center">
            <span className="font-bold text-lg text-foreground">{socialStats.follower_count}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-center">
            <span className="font-bold text-lg text-foreground">{socialStats.following_count}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
};
