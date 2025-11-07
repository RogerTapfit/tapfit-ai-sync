import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/services/socialService';
import { useUserFollow } from '@/hooks/useUserFollow';
import { Users, Share2, QrCode, Globe, Lock, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfileQRCode } from './ProfileQRCode';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { RobotAvatarDisplay } from '@/components/RobotAvatarDisplay';

interface UserProfileCardProps {
  user: UserProfile;
  showFollowButton?: boolean;
  onClick?: () => void;
}

export const UserProfileCard = ({ user, showFollowButton = true, onClick }: UserProfileCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFollowing, actionLoading, toggleFollow } = useUserFollow(user.id);
  const [showQRCode, setShowQRCode] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/profile/${user.username}`);
    }
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow();
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/profile/${user.username}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleQRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQRCode(true);
  };

  const getInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Dual Avatar Display */}
            <div className="flex gap-2 items-center">
              {/* User Profile Photo */}
              <div className="flex flex-col items-center gap-1">
                <Avatar className="h-10 w-10 ring-1 ring-red-500/10">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
                  <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground">You</span>
              </div>
              
              {/* Coach Avatar */}
              <div className="flex flex-col items-center gap-1">
                {user.avatar_data ? (
                  <div className="w-10">
                    <RobotAvatarDisplay
                      avatarData={user.avatar_data}
                      size="small"
                      showAnimation={false}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/10">
                    <span className="text-[8px] text-muted-foreground">?</span>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground">Coach</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {user.full_name || user.username}
              </div>
              {user.username && (
                <div className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </div>
              )}
              {user.bio && (
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {user.bio}
                </div>
              )}
              
              {/* Workout Visibility Badge */}
              <div className="mt-1.5">
                {!user.share_workout_stats ? (
                  <Badge variant="outline" className="text-xs gap-1 border-muted-foreground/30 h-5">
                    <EyeOff className="h-2.5 w-2.5" />
                    <span>Private</span>
                  </Badge>
                ) : user.workout_visibility === 'public' ? (
                  <Badge variant="outline" className="text-xs gap-1 border-green-500/30 text-green-500 h-5">
                    <Globe className="h-2.5 w-2.5" />
                    <span>Public</span>
                  </Badge>
                ) : user.workout_visibility === 'followers' ? (
                  <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500 h-5">
                    <Users className="h-2.5 w-2.5" />
                    <span>Followers</span>
                  </Badge>
                ) : null}
              </div>
            </div>

            {showFollowButton && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQRClick}
                  className="h-8 w-8 p-0"
                  title="View QR code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShareClick}
                  className="h-8 w-8 p-0"
                  title="Share profile"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowClick}
                  disabled={actionLoading}
                >
                  {isFollowing ? (
                    <>
                      <Users className="h-4 w-4 mr-1" />
                      Following
                    </>
                  ) : (
                    'Follow'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {user.username && (
        <ProfileQRCode
          open={showQRCode}
          onOpenChange={setShowQRCode}
          username={user.username}
          displayName={user.full_name || undefined}
        />
      )}
    </>
  );
};
