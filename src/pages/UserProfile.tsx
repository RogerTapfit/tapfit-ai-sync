import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSocialProfile } from '@/hooks/useSocialProfile';
import { useUserFollow } from '@/hooks/useUserFollow';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { socialService } from '@/services/socialService';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, Dumbbell, Trophy, TrendingUp, Home, Coins, Flame, Target, Calendar, Globe, Lock, Eye, EyeOff, Settings } from 'lucide-react';
import { usePageContext } from '@/hooks/usePageContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import UserWorkoutHistory from '@/components/social/UserWorkoutHistory';
import { AchievementBadges } from '@/components/social/AchievementBadges';
import { ProfileChallengesStreaks } from '@/components/social/ProfileChallengesStreaks';
import { WorkoutHeatmap } from '@/components/social/WorkoutHeatmap';
import { RobotAvatarDisplay } from '@/components/RobotAvatarDisplay';
import { useCoachEncouragement } from '@/hooks/useCoachEncouragement';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("overview");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const { profile, stats, loading: profileLoading } = useSocialProfile(userId);
  const { isFollowing, isFollower, actionLoading, toggleFollow } = useUserFollow(userId);
  const { achievements, loading: achievementsLoading } = useUserAchievements(userId);
  const { handleCoachClick, isSpeaking, canSpeak } = useCoachEncouragement();

  // Register page context for chatbot
  usePageContext({
    pageName: `User Profile - ${username || 'Unknown'}`,
    pageDescription: `Viewing ${isOwnProfile ? 'your own' : 'a user'} profile with stats and achievements`,
    visibleContent: profile ? `Profile: @${profile.username}, ${profile.full_name || 'No name'}. Stats: ${stats?.workout_count || 0} workouts, ${stats?.follower_count || 0} followers, ${stats?.following_count || 0} following, ${profile.tap_coins_balance || 0} Tap Coins. ${achievements.length} achievements earned.` : 'Loading profile...'
  });

  useEffect(() => {
    if (username) {
      loadUserByUsername();
    }
  }, [username]);

  useEffect(() => {
    checkIfOwnProfile();
  }, [userId]);

  const checkIfOwnProfile = async () => {
    if (!userId) return;
    const { data: { user } } = await supabase.auth.getUser();
    setIsOwnProfile(user?.id === userId);
  };

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
      {/* Header */}
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
        {isOwnProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile-customize')}
            className="ml-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card className="mb-6 border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Dual Avatar Display */}
            <div className="flex gap-4 items-start">
              {/* User Profile Photo */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">You</span>
                <Avatar className="h-24 w-24 ring-2 ring-red-500/10">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || 'User'} />
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
              </div>

              {/* Coach/Robot Avatar */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Coach</span>
                {profile.avatar_data || (profile as any).avatar_id ? (
                  <div className="w-24">
                    <RobotAvatarDisplay
                      avatarData={{ ...(profile as any).avatar_data, avatar_id: (profile as any).avatar_id }}
                      size="small"
                      showAnimation={true}
                      onClick={isOwnProfile ? handleCoachClick : undefined}
                      isClickable={isOwnProfile && canSpeak}
                      isSpeaking={isOwnProfile && isSpeaking}
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                    <span className="text-xs text-muted-foreground text-center px-2">No coach</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              {profile.username && (
                <p className="text-muted-foreground">@<span className="text-red-500">{profile.username}</span></p>
              )}
              {profile.bio && (
                <p className="mt-2 text-sm">{profile.bio}</p>
              )}

              {/* Workout Visibility Indicator */}
              <div className="mt-3 flex justify-center md:justify-start">
                {!profile.share_workout_stats ? (
                  <Badge variant="outline" className="gap-1.5 border-muted-foreground/30">
                    <EyeOff className="h-3 w-3" />
                    <span>Workouts Private</span>
                  </Badge>
                ) : profile.workout_visibility === 'public' ? (
                  <Badge variant="outline" className="gap-1.5 border-green-500/30 text-green-500">
                    <Globe className="h-3 w-3" />
                    <span>Public Workouts</span>
                  </Badge>
                ) : profile.workout_visibility === 'followers' ? (
                  <Badge variant="outline" className="gap-1.5 border-blue-500/30 text-blue-500">
                    <Users className="h-3 w-3" />
                    <span>Followers Only</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1.5 border-muted-foreground/30">
                    <Lock className="h-3 w-3" />
                    <span>Private</span>
                  </Badge>
                )}
              </div>

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Activity Heatmap */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  Workout Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userId ? (
                  <WorkoutHeatmap userId={userId} months={6} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading activity data...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Section */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Progress & Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weekly Goal Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Weekly Workouts</span>
                    </div>
                    <span className="text-muted-foreground">{Math.min(stats?.workout_count || 0, 4)}/4</span>
                  </div>
                  <Progress 
                    value={Math.min(((stats?.workout_count || 0) / 4) * 100, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Current Streak */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Current Streak</span>
                    </div>
                    <span className="text-muted-foreground">{Math.min(stats?.workout_count || 0, 7)} days</span>
                  </div>
                  <Progress 
                    value={Math.min(((stats?.workout_count || 0) / 7) * 100, 100)} 
                    className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-500"
                  />
                </div>

                {/* Monthly Activity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Monthly Activity</span>
                    </div>
                    <span className="text-muted-foreground">{Math.min(stats?.workout_count || 0, 12)}/12 workouts</span>
                  </div>
                  <Progress 
                    value={Math.min(((stats?.workout_count || 0) / 12) * 100, 100)} 
                    className="h-2 [&>div]:bg-blue-500"
                  />
                </div>

                {/* Total Exercises Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Total Exercises</span>
                    </div>
                    <span className="text-muted-foreground">{stats?.total_exercises || 0}</span>
                  </div>
                  <Progress 
                    value={Math.min(((stats?.total_exercises || 0) / 100) * 100, 100)} 
                    className="h-2 [&>div]:bg-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card 
                className="hover:border-red-500/20 transition-colors cursor-pointer"
                onClick={() => setActiveTab("workouts")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Dumbbell className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.workout_count || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                </CardContent>
              </Card>

              <Card 
                className="hover:border-blue-500/20 transition-colors cursor-pointer"
                onClick={() => setActiveTab("workouts")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Exercises</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_exercises || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
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
