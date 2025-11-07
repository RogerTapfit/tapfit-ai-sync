import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocialProfile } from '@/hooks/useSocialProfile';
import { useUserFollow } from '@/hooks/useUserFollow';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { socialService } from '@/services/socialService';
import { ArrowLeft, Users, Dumbbell, Trophy, TrendingUp, Home, Coins } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import UserWorkoutHistory from '@/components/social/UserWorkoutHistory';
import { AchievementBadges } from '@/components/social/AchievementBadges';
import { ProfileChallengesStreaks } from '@/components/social/ProfileChallengesStreaks';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  
  const { profile, stats, loading: profileLoading } = useSocialProfile(userId);
  const { isFollowing, isFollower, actionLoading, toggleFollow } = useUserFollow(userId);
  const { achievements, loading: achievementsLoading } = useUserAchievements(userId);

  useEffect(() => {
    if (username) {
      loadUserByUsername();
    }
  }, [username]);

  const loadUserByUsername = async () => {
    if (!username) return;
    
    const user = await socialService.getUserByUsername(username);
    if (user) {
      setUserId(user.id);
    } else {
      navigate('/404');
    }
  };

  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profile.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <div className="flex gap-2 mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
        >
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="mb-6 border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-red-500/10">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || 'User'} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              {profile.username && (
                <p className="text-muted-foreground">@<span className="text-red-500">{profile.username}</span></p>
              )}
              {profile.bio && (
                <p className="mt-2 text-sm">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-6 mt-4 justify-center md:justify-start">
                <div className="text-center">
                  <div className="font-bold text-lg">{stats?.follower_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{stats?.following_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-red-500">{stats?.workout_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg flex items-center gap-1 justify-center text-yellow-500">
                    <Coins className="h-4 w-4" />
                    {profile.tap_coins_balance || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Tap Coins</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 justify-center md:justify-start">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={toggleFollow}
                  disabled={actionLoading}
                >
                  {isFollowing ? (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    'Follow'
                  )}
                </Button>
                {isFollower && (
                  <Badge variant="secondary">Follows you</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Tabs */}
      {profile.share_workout_stats ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:border-red-500/20 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Dumbbell className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.workout_count || 0}</div>
                </CardContent>
              </Card>

              <Card className="hover:border-blue-500/20 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Exercises</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_exercises || 0}</div>
                </CardContent>
              </Card>

              <Card className="hover:border-yellow-500/20 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{achievements.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Badges earned</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workouts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                {userId ? (
                  <UserWorkoutHistory userId={userId} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Loading workout history...
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges">
            {userId ? (
              <ProfileChallengesStreaks userId={userId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading challenges...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementBadges 
                  achievements={achievements} 
                  loading={achievementsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              This user's workout stats are private
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
