import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useWorkoutStreak } from '@/hooks/useWorkoutStreak';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  TrendingUp,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakCelebrationProps {
  isVisible: boolean;
  milestoneDays: number;
  coinsEarned: number;
  currentStreak: number;
  onClose: () => void;
}

const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  isVisible,
  milestoneDays,
  coinsEarned,
  currentStreak,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.6 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10"
          >
            <Card className="w-[90vw] max-w-md border-2 border-orange-500 shadow-2xl">
              <CardContent className="p-6 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <Flame className="h-20 w-20 text-orange-500" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold mb-2">
                    {milestoneDays}-Day Streak! 🔥
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    You're on fire! Keep it going!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="text-6xl font-bold text-orange-500"
                >
                  {currentStreak}
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg"
                >
                  <Award className="h-6 w-6 text-yellow-500" />
                  <span className="text-lg font-bold">+{coinsEarned} TapCoins</span>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button onClick={onClose} className="w-full" size="lg">
                    Keep The Streak Alive! 💪
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface WorkoutStreakTrackerProps {
  compact?: boolean;
  showMilestones?: boolean;
}

export const WorkoutStreakTracker: React.FC<WorkoutStreakTrackerProps> = ({ 
  compact = false,
  showMilestones = true
}) => {
  const { streak, milestones, loading, getNextMilestone, isStreakActive } = useWorkoutStreak();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    milestoneDays: number;
    coinsEarned: number;
    currentStreak: number;
  } | null>(null);

  const nextMilestone = getNextMilestone();
  const streakActive = isStreakActive();

  useEffect(() => {
    // Check for new milestone achievement
    if (milestones.length > 0) {
      const latestMilestone = milestones[0];
      const achievedRecently = new Date().getTime() - new Date(latestMilestone.achievedAt).getTime() < 60000; // Within last minute
      
      if (achievedRecently) {
        setCelebrationData({
          milestoneDays: latestMilestone.milestoneDays,
          coinsEarned: latestMilestone.coinsAwarded,
          currentStreak: latestMilestone.streakCount
        });
        setShowCelebration(true);
      }
    }
  }, [milestones]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading streak...</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
        <div className="p-2 bg-orange-500/20 rounded-full">
          <Flame className={`h-5 w-5 ${streakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {streak?.currentStreak || 0} Day Streak
          </div>
          {nextMilestone && (
            <div className="text-xs text-muted-foreground">
              {nextMilestone.daysRemaining} days to {nextMilestone.target}-day milestone
            </div>
          )}
        </div>
        {!streakActive && streak && streak.currentStreak > 0 && (
          <Badge variant="destructive" className="text-xs">
            Streak at risk!
          </Badge>
        )}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
            Workout Streak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Streak */}
          <div className="text-center">
            <div className="text-6xl font-bold text-orange-500 mb-2">
              {streak?.currentStreak || 0}
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              {streak?.currentStreak === 1 ? 'Day' : 'Days'} in a row
            </div>
            {!streakActive && streak && streak.currentStreak > 0 && (
              <Badge variant="destructive" className="mt-2">
                Workout today to keep your streak!
              </Badge>
            )}
            {streakActive && (
              <Badge className="mt-2 bg-orange-500">
                🔥 Streak Active
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary/50 rounded-lg text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <div className="text-2xl font-bold">{streak?.longestStreak || 0}</div>
              <div className="text-xs text-muted-foreground">Longest Streak</div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg text-center">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className="text-2xl font-bold">{streak?.totalWorkoutDays || 0}</div>
              <div className="text-xs text-muted-foreground">Total Days</div>
            </div>
          </div>

          {/* Next Milestone */}
          {nextMilestone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Next Milestone: {nextMilestone.target} days
                </span>
                <span className="font-semibold">
                  {nextMilestone.daysRemaining} to go
                </span>
              </div>
              <Progress value={nextMilestone.progress} className="h-2" />
              <div className="text-xs text-center text-muted-foreground">
                Earn bonus coins at milestone!
              </div>
            </div>
          )}

          {/* Milestone Progress */}
          {showMilestones && (
            <div className="space-y-2">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" />
                Milestones
              </div>
              <div className="flex flex-wrap gap-2">
                {[7, 14, 30, 60, 100].map((days) => {
                  const achieved = streak?.milestonesAchieved?.[days.toString()];
                  const coins = days === 7 ? 100 : days === 14 ? 250 : days === 30 ? 500 : days === 60 ? 1000 : 2000;
                  
                  return (
                    <div
                      key={days}
                      className={`flex-1 min-w-[80px] p-2 rounded-lg border-2 text-center ${
                        achieved
                          ? 'bg-yellow-500/10 border-yellow-500'
                          : 'bg-secondary/20 border-secondary'
                      }`}
                    >
                      <div className={`text-lg font-bold ${achieved ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        {days}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {achieved ? '✓' : `+${coins}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Milestones */}
          {milestones.length > 0 && showMilestones && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Recent Achievements</div>
              <div className="space-y-2">
                {milestones.slice(0, 3).map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-yellow-500/20 rounded">
                        <Flame className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {milestone.milestoneDays} Day Streak
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(milestone.achievedAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      +{milestone.coinsAwarded} coins
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      {celebrationData && (
        <StreakCelebration
          isVisible={showCelebration}
          milestoneDays={celebrationData.milestoneDays}
          coinsEarned={celebrationData.coinsEarned}
          currentStreak={celebrationData.currentStreak}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  );
};
