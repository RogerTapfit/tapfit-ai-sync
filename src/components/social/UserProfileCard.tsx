import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/services/socialService';
import { useUserFollow } from '@/hooks/useUserFollow';
import { Users, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfileCardProps {
  user: UserProfile;
  showFollowButton?: boolean;
  onClick?: () => void;
}

export const UserProfileCard = ({ user, showFollowButton = true, onClick }: UserProfileCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFollowing, actionLoading, toggleFollow } = useUserFollow(user.id);

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
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          
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
          </div>

          {showFollowButton && (
            <div className="flex items-center gap-2">
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
  );
};
