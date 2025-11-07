import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNetworkCard } from './UserNetworkCard';
import { useNetworkList } from '@/hooks/useNetworkList';
import { useUserFollow } from '@/hooks/useUserFollow';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus } from 'lucide-react';

export function NetworkList() {
  const { followers, following, loading } = useNetworkList();

  if (loading) {
    return (
      <Card className="border-violet-500/20 shadow-lg shadow-violet-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-lg" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <Users className="h-4 w-4 text-violet-400" />
            </div>
            Your Network
          </CardTitle>
          <CardDescription>Loading your connections...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-500/20 shadow-lg shadow-violet-500/5">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-lg" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
          </div>
          Your Network
        </CardTitle>
        <CardDescription>
          <span className="font-medium text-violet-400">{followers.length}</span> followers · <span className="font-medium text-purple-400">{following.length}</span> following
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Tabs defaultValue="following" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-violet-500/5">
            <TabsTrigger value="following" className="text-xs sm:text-sm">
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="followers" className="text-xs sm:text-sm">
              Followers ({followers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4 space-y-3">
            {following.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  You're not following anyone yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Search for users to start building your network
                </p>
              </div>
            ) : (
              following.map((user) => (
                <FollowingUserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4 space-y-3">
            {followers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No followers yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your profile to grow your network
                </p>
              </div>
            ) : (
              followers.map((user) => (
                <FollowerUserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Component for users in the "Following" tab - shows unfollow button
function FollowingUserCard({ user }: { user: any }) {
  const { isFollowing, actionLoading, toggleFollow, refetch } = useUserFollow(user.id);

  const handleToggle = async () => {
    await toggleFollow();
    refetch();
  };

  return (
    <UserNetworkCard
      user={user}
      showFollowButton={true}
      onFollowToggle={handleToggle}
      isFollowing={isFollowing}
      actionLoading={actionLoading}
    />
  );
}

// Component for users in the "Followers" tab - shows follow back button
function FollowerUserCard({ user }: { user: any }) {
  const { isFollowing, actionLoading, toggleFollow, refetch } = useUserFollow(user.id);

  const handleToggle = async () => {
    await toggleFollow();
    refetch();
  };

  return (
    <UserNetworkCard
      user={user}
      showFollowButton={true}
      onFollowToggle={handleToggle}
      isFollowing={isFollowing}
      actionLoading={actionLoading}
    />
  );
}
