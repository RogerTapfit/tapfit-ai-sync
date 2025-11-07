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
      <Card>
        <CardHeader>
          <CardTitle>Your Network</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Network
        </CardTitle>
        <CardDescription>
          {followers.length} followers · {following.length} following
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="following" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4 space-y-3">
            {following.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
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
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
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
