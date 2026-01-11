import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPlus, UserMinus, Share2, Eye, EyeOff, Palette } from 'lucide-react';
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
  customBannerColor?: string;
  onBannerColorChange?: (color: string) => void;
}

const getDisplayName = (profile: { full_name?: string; username?: string }) => {
  return profile.full_name || profile.username || 'User';
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const FUN_COLORS = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Lime', value: '#84CC16' },
];

export const ProfileHero = ({
  profile,
  socialStats,
  isOwnProfile,
  isFollowing,
  followsBack,
  onFollowToggle,
  rankColor = '#6366f1',
  customBannerColor,
  onBannerColorChange
}: ProfileHeroProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const bannerColor = customBannerColor || rankColor;

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
      {/* Cover Banner with Custom/Rank Gradient */}
      <div 
        className="h-32 sm:h-40 rounded-t-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${bannerColor}50, ${bannerColor}25, hsl(var(--background)))`
        }}
      >
        {/* Color Picker Button - Only on own profile */}
        {isOwnProfile && onBannerColorChange && (
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-background/50 hover:bg-background/80 backdrop-blur-sm"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Banner Color</p>
                <div className="grid grid-cols-6 gap-2">
                  {FUN_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onBannerColorChange(color.value);
                        setShowColorPicker(false);
                      }}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ 
                        backgroundColor: color.value,
                        borderColor: customBannerColor === color.value ? 'white' : 'transparent'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    onBannerColorChange('');
                    setShowColorPicker(false);
                  }}
                >
                  Reset to Rank Color
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-4 sm:px-6 pb-4 -mt-14 sm:-mt-16">
        {/* Avatar Row */}
        <div className="flex items-end gap-3 mb-4">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-xl shrink-0">
            <AvatarImage src={profile.avatar_url || ''} alt={getDisplayName(profile)} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {getInitials(profile.full_name || profile.username || '')}
            </AvatarFallback>
          </Avatar>
          
          {(profile.avatar_data || profile.avatar_id) && (
            <div className="w-14 h-14 sm:w-16 sm:h-16 -ml-6 mb-1 shrink-0">
              <RobotAvatarDisplay 
                avatarData={{ ...profile.avatar_data, avatar_id: profile.avatar_id }}
                size="small"
                className="border-2 border-background rounded-full shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Name & Username */}
        <div className="space-y-1 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {getDisplayName(profile)}
          </h1>
          <p className="text-muted-foreground text-sm">@{profile.username || 'user'}</p>
        </div>

        {/* Privacy Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {profile.is_profile_public ? (
            <Badge variant="outline" className="text-xs gap-1 shrink-0">
              <Eye className="w-3 h-3" /> Public
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1 shrink-0">
              <EyeOff className="w-3 h-3" /> Private
            </Badge>
          )}
          {followsBack && !isOwnProfile && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Follows you
            </Badge>
          )}
          
          <div className="flex-1" />
          
          {/* Action Buttons */}
          {!isOwnProfile && (
            <Button
              onClick={onFollowToggle}
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleShare} className="shrink-0 h-8 w-8">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-foreground/80 text-sm mb-4 max-w-2xl">{profile.bio}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <div>
            <span className="font-bold text-lg text-foreground">{socialStats.workout_count}</span>
            <span className="text-muted-foreground ml-1.5 text-xs sm:text-sm">Workouts</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="font-bold text-lg text-foreground">{socialStats.follower_count}</span>
            <span className="text-muted-foreground ml-1.5 text-xs sm:text-sm">Followers</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="font-bold text-lg text-foreground">{socialStats.following_count}</span>
            <span className="text-muted-foreground ml-1.5 text-xs sm:text-sm">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
};
