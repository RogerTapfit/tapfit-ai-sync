import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, Trophy, TrendingUp, Clock, Coins } from 'lucide-react';
import { useUserChallenges } from '@/hooks/useUserChallenges';
import { useWorkoutStreak } from '@/hooks/useWorkoutStreak';
import { format, differenceInDays } from 'date-fns';

interface ProfileChallengesStreaksProps {
  userId: string;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-orange-500',
  extreme: 'bg-red-500',
};

export const ProfileChallengesStreaks = ({ userId }: ProfileChallengesStreaksProps) => {
  const { activeChallenges, completedChallenges, loading: challengesLoading } = useUserChallenges(userId);
  const { streak, milestones, loading: streakLoading } = useWorkoutStreak();

  const isOwnProfile = true; // TODO: Check if viewing own profile
  const loading = challengesLoading || streakLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-24 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const streakActive = streak?.lastWorkoutDate && 
    differenceInDays(new Date(), new Date(streak.lastWorkoutDate)) <= 1;

  return (
    <div className="space-y-6">
      {/* Workout Streak */}
      <Card className={streakActive ? 'border-orange-500 dark:border-orange-700' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
            Workout Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streak ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{streak.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-muted-foreground">{streak.longestStreak}</div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
              </div>

              {streak.lastWorkoutDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last workout: {format(new Date(streak.lastWorkoutDate), 'MMM d, yyyy')}
                </div>
              )}

              {/* Recent Milestones */}
              {milestones && milestones.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Recent Milestones</div>
                  <div className="flex flex-wrap gap-2">
                    {milestones.slice(0, 3).map((milestone) => (
                      <Badge key={milestone.id} variant="secondary" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        {milestone.milestoneDays} days
                        <span className="text-yellow-600 dark:text-yellow-400">
                          +{milestone.coinsAwarded}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No workout streak data yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Challenges ({activeChallenges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeChallenges.map((userChallenge) => {
              const progress = (userChallenge.current_progress / userChallenge.target_value) * 100;
              const daysRemaining = userChallenge.challenge.time_limit_days
                ? userChallenge.challenge.time_limit_days - 
                  differenceInDays(new Date(), new Date(userChallenge.started_at))
                : null;

              return (
                <div key={userChallenge.id} className="space-y-2 p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{userChallenge.challenge.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {userChallenge.challenge.description}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${difficultyColors[userChallenge.challenge.difficulty_level]} text-white border-0 shrink-0`}
                    >
                      {userChallenge.challenge.difficulty_level}
                    </Badge>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {userChallenge.current_progress} / {userChallenge.target_value} {userChallenge.challenge.challenge_type}
                    </span>
                    <div className="flex items-center gap-3">
                      {daysRemaining !== null && daysRemaining >= 0 && (
                        <span className="text-muted-foreground">
                          {daysRemaining} days left
                        </span>
                      )}
                      <span className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {userChallenge.challenge.coin_reward}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Completed Challenges ({completedChallenges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedChallenges.slice(0, 5).map((userChallenge) => (
              <div 
                key={userChallenge.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{userChallenge.challenge.name}</h4>
                  {userChallenge.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Completed {format(new Date(userChallenge.completed_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                    <Trophy className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">
                    +{userChallenge.challenge.coin_reward}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {activeChallenges.length === 0 && completedChallenges.length === 0 && !streak && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No challenges or streaks yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start working out to build streaks and join challenges!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
