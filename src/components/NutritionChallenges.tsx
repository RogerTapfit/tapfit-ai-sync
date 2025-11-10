import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNutritionChallenges, useNutritionChallengeLeaderboard } from '@/hooks/useNutritionChallenges';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Calendar, Coins, Medal, TrendingUp, Users } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const NutritionChallenges = () => {
  const { challenges, loading, joinChallenge, leaveChallenge, refetch } = useNutritionChallenges();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const { leaderboard, userParticipation, loading: leaderboardLoading, refetch: refetchLeaderboard } = useNutritionChallengeLeaderboard(selectedChallengeId);

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'best_average_grade':
        return <Trophy className="h-5 w-5" />;
      case 'meals_above_grade':
        return <Target className="h-5 w-5" />;
      case 'weekly_health_score':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Medal className="h-5 w-5" />;
    }
  };

  const getChallengeStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isBefore(now, start)) return 'upcoming';
    if (isAfter(now, end)) return 'ended';
    return 'active';
  };

  const getGradeColor = (grade: string) => {
    const upperGrade = grade.toUpperCase();
    if (upperGrade.includes('A')) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (upperGrade.includes('B')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  };

  const handleJoinChallenge = async (challengeId: string) => {
    const success = await joinChallenge(challengeId);
    if (success) {
      refetch();
      if (selectedChallengeId === challengeId) {
        refetchLeaderboard();
      }
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    const success = await leaveChallenge(challengeId);
    if (success) {
      refetch();
      if (selectedChallengeId === challengeId) {
        setSelectedChallengeId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
            <p className="text-muted-foreground">
              Check back later for new nutrition challenges!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <AnimatePresence>
          {challenges.map((challenge, index) => {
            const status = getChallengeStatus(challenge.start_date, challenge.end_date);
            const daysRemaining = Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedChallengeId(challenge.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                          {getChallengeTypeIcon(challenge.challenge_type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{challenge.name}</CardTitle>
                          <CardDescription>{challenge.description}</CardDescription>
                        </div>
                      </div>
                      {status === 'active' && (
                        <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      )}
                      {status === 'upcoming' && (
                        <Badge variant="secondary">Upcoming</Badge>
                      )}
                      {status === 'ended' && (
                        <Badge variant="outline" className="opacity-50">Ended</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-primary font-semibold">
                          <Coins className="h-4 w-4" />
                          {challenge.coin_reward} coins
                        </div>
                      </div>

                      {status === 'active' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{daysRemaining} days remaining</span>
                            <span className="text-muted-foreground">Min {challenge.min_meals_required} meals</span>
                          </div>
                          <Progress value={(7 - daysRemaining) / 7 * 100} className="h-2" />
                        </div>
                      )}

                      <Button 
                        className="w-full"
                        variant={status === 'active' ? 'default' : 'outline'}
                        disabled={status !== 'active'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChallengeId(challenge.id);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Leaderboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Dialog open={!!selectedChallengeId} onOpenChange={(open) => !open && setSelectedChallengeId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Challenge Leaderboard</DialogTitle>
            <DialogDescription>
              {challenges.find(c => c.id === selectedChallengeId)?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {userParticipation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Your Progress</span>
                    {userParticipation.rank && (
                      <Badge variant="secondary">
                        Rank #{userParticipation.rank}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Meals Logged</p>
                      <p className="font-semibold text-lg">{userParticipation.total_meals}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Grade Score</p>
                      <p className="font-semibold text-lg">{userParticipation.average_grade_score.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quality Meals</p>
                      <p className="font-semibold text-lg">{userParticipation.meals_above_target}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Health Score</p>
                      <p className="font-semibold text-lg">{userParticipation.total_health_score.toFixed(0)}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => selectedChallengeId && handleLeaveChallenge(selectedChallengeId)}
                  >
                    Leave Challenge
                  </Button>
                </CardContent>
              </Card>
            )}

            {!userParticipation && selectedChallengeId && (
              <Button 
                className="w-full"
                onClick={() => handleJoinChallenge(selectedChallengeId)}
              >
                Join Challenge
              </Button>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold">Leaderboard</h4>
              {leaderboardLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No participants yet. Be the first to join!
                </p>
              ) : (
                leaderboard.map((participant, index) => (
                  <Card key={participant.id} className={index < 3 ? 'border-primary/20' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                            {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                            {index === 2 && <Medal className="h-5 w-5 text-orange-600" />}
                            <span className="font-semibold text-lg">
                              #{participant.rank || index + 1}
                            </span>
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={participant.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {participant.profile?.username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {participant.profile?.username || participant.profile?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {participant.total_meals} meals • Score: {participant.average_grade_score.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={getGradeColor(`Grade ${participant.average_grade_score >= 90 ? 'A' : participant.average_grade_score >= 80 ? 'B' : 'C'}`)}>
                            {participant.average_grade_score >= 90 ? 'A' : participant.average_grade_score >= 80 ? 'B' : 'C'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
