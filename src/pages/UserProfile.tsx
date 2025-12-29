import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocialProfile } from '@/hooks/useSocialProfile';
import { useUserFollow } from '@/hooks/useUserFollow';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { usePublicGamerStats } from '@/hooks/usePublicGamerStats';
import { useWeeklyWorkoutStats } from '@/hooks/useWeeklyWorkoutStats';
import { useFriendChallenges } from '@/hooks/useFriendChallenges';
import { socialService } from '@/services/socialService';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Dumbbell, Trophy, Home, Settings, Calendar, Footprints, Swords } from 'lucide-react';
import { usePageContext } from '@/hooks/usePageContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import UserWorkoutHistory from '@/components/social/UserWorkoutHistory';
import { AchievementBadges } from '@/components/social/AchievementBadges';
import { ProfileChallengesStreaks } from '@/components/social/ProfileChallengesStreaks';
import { WorkoutHeatmap } from '@/components/social/WorkoutHeatmap';
import { ProfileHero } from '@/components/social/ProfileHero';
import { ProfileGamerStats } from '@/components/social/ProfileGamerStats';
import { WeeklyActivitySummary } from '@/components/social/WeeklyActivitySummary';
import { UserCardioHistory } from '@/components/social/UserCardioHistory';
import { ChallengeUserModal } from '@/components/social/ChallengeUserModal';
import { FriendChallengeCard } from '@/components/social/FriendChallengeCard';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("overview");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { profile, stats, loading: profileLoading } = useSocialProfile(userId);
  const { isFollowing, isFollower, actionLoading, toggleFollow } = useUserFollow(userId);
  const { achievements, loading: achievementsLoading } = useUserAchievements(userId);
  const { stats: gamerStats, loading: gamerLoading, getProgressPercentage } = usePublicGamerStats(userId || null);
  const { stats: weeklyStats, loading: weeklyLoading } = useWeeklyWorkoutStats(userId || null);
  const { challenges, activeChallenges, pendingChallenges, refetch: refetchChallenges } = useFriendChallenges(currentUserId || undefined);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      if (userId) {
        setIsOwnProfile(user.id === userId);
      }
    }
  };

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

  // Get rank color for gradient
  const getRankColor = (level: number) => {
    if (!level) return '#6366f1';
    if (level <= 5) return '#94a3b8';
    if (level <= 10) return '#eab308';
    if (level <= 15) return '#f97316';
    if (level <= 20) return '#ef4444';
    if (level <= 25) return '#8b5cf6';
    if (level <= 30) return '#06b6d4';
    if (level <= 35) return '#3b82f6';
    if (level <= 40) return '#6366f1';
    if (level <= 45) return '#a855f7';
    return '#fbbf24';
  };

  const rankColor = getRankColor(gamerStats?.current_level || 1);

  return (
    <div className="container max-w-4xl mx-auto pb-20">
      {/* Navigation Header */}
      <div className="flex gap-2 p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
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
        {!isOwnProfile && isFollowing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChallengeModal(true)}
            className="ml-auto"
          >
            <Swords className="h-4 w-4 mr-2" />
            Challenge
          </Button>
        )}
      </div>

      {/* Enhanced Profile Hero Section */}
      <Card className="mx-4 mb-6 border-border/50 overflow-hidden">
        <ProfileHero
          profile={{
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            avatar_id: (profile as any).avatar_id,
            avatar_data: (profile as any).avatar_data,
            is_profile_public: profile.is_profile_public,
            share_workout_stats: profile.share_workout_stats,
            workout_visibility: profile.workout_visibility
          }}
          socialStats={{
            follower_count: stats?.follower_count || 0,
            following_count: stats?.following_count || 0,
            workout_count: stats?.workout_count || 0
          }}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followsBack={isFollower}
          onFollowToggle={toggleFollow}
          rankColor={rankColor}
        />
      </Card>

      {/* Gamer Stats & Weekly Activity - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 mb-6">
        <ProfileGamerStats
          stats={gamerStats}
          tapCoins={profile.tap_coins_balance || 0}
          tapTokens={(profile as any).tap_tokens_balance || 0}
          progressPercentage={getProgressPercentage()}
        />
        <WeeklyActivitySummary
          stats={weeklyStats}
          loading={weeklyLoading}
        />
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        {profile.share_workout_stats ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm">
                <Calendar className="w-4 h-4 hidden sm:block" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="workouts" className="gap-1 text-xs sm:text-sm">
                <Dumbbell className="w-4 h-4 hidden sm:block" />
                Workouts
              </TabsTrigger>
              <TabsTrigger value="cardio" className="gap-1 text-xs sm:text-sm">
                <Footprints className="w-4 h-4 hidden sm:block" />
                Cardio
              </TabsTrigger>
              <TabsTrigger value="challenges" className="text-xs sm:text-sm">Challenges</TabsTrigger>
              <TabsTrigger value="achievements" className="gap-1 text-xs sm:text-sm">
                <Trophy className="w-4 h-4 hidden sm:block" />
                Badges
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Activity Heatmap */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Activity Calendar
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

              {/* Quick Stats Grid */}
              <div className="grid gap-4 grid-cols-3">
                <Card 
                  className="hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("workouts")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.workout_count || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>

                <Card className="hover:border-yellow-500/20 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("achievements")}>
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

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Exercises</CardTitle>
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Dumbbell className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_exercises || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Completed</p>
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

            <TabsContent value="cardio">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Footprints className="h-5 w-5 text-blue-500" />
                    Cardio Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userId ? (
                    <UserCardioHistory userId={userId} />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Loading cardio history...
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="challenges">
              {userId ? (
                <>
                  {/* Friend Challenges Section */}
                  {currentUserId && (activeChallenges.length > 0 || pendingChallenges.length > 0) && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Swords className="h-5 w-5 text-primary" />
                          Friend Challenges
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[...pendingChallenges, ...activeChallenges]
                          .filter(c => c.challenger_id === userId || c.challenged_id === userId)
                          .map(challenge => (
                            <FriendChallengeCard
                              key={challenge.id}
                              challenge={challenge}
                              currentUserId={currentUserId}
                              onAction={refetchChallenges}
                            />
                          ))}
                      </CardContent>
                    </Card>
                  )}
                  <ProfileChallengesStreaks userId={userId} />
                </>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-muted-foreground text-center">
                      Loading challenges...
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements & Badges</CardTitle>
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
              <div className="text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Workout Stats are Private</p>
                <p className="text-sm mt-2">
                  This user has chosen not to share their workout statistics.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Challenge Modal */}
      {userId && profile?.username && (
        <ChallengeUserModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          targetUserId={userId}
          targetUsername={profile.username}
        />
      )}
    </div>
  );
}
