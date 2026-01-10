import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sprout, Trophy, Flame, Calendar, Swords } from 'lucide-react';
import { PublicSobrietyJourney } from '@/hooks/usePublicSobrietyJourney';

interface ProfileSobrietyCardProps {
  journey: PublicSobrietyJourney;
  isOwnProfile: boolean;
  onChallenge?: () => void;
  showChallengeButton?: boolean;
}

const SUBSTANCE_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  'alcohol': { label: 'Alcohol', emoji: '🍺', color: 'bg-amber-500/10 text-amber-600' },
  'sugar': { label: 'Sugar', emoji: '🍬', color: 'bg-pink-500/10 text-pink-600' },
  'caffeine': { label: 'Caffeine', emoji: '☕', color: 'bg-orange-500/10 text-orange-600' },
  'smoking': { label: 'Smoking', emoji: '🚬', color: 'bg-gray-500/10 text-gray-600' },
  'cannabis': { label: 'Cannabis', emoji: '🌿', color: 'bg-green-500/10 text-green-600' },
  'social_media': { label: 'Social Media', emoji: '📱', color: 'bg-blue-500/10 text-blue-600' },
  'general': { label: 'General', emoji: '🌱', color: 'bg-emerald-500/10 text-emerald-600' }
};

const MILESTONE_BADGES = [
  { days: 7, label: '1 Week', emoji: '🎯' },
  { days: 14, label: '2 Weeks', emoji: '💪' },
  { days: 30, label: '1 Month', emoji: '🏆' },
  { days: 60, label: '2 Months', emoji: '⭐' },
  { days: 90, label: '3 Months', emoji: '👑' }
];

export const ProfileSobrietyCard = ({ 
  journey, 
  isOwnProfile, 
  onChallenge,
  showChallengeButton = true 
}: ProfileSobrietyCardProps) => {
  const substanceInfo = SUBSTANCE_INFO[journey.substance_type] || SUBSTANCE_INFO['general'];
  const earnedMilestones = MILESTONE_BADGES.filter(m => journey.current_day >= m.days);

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-emerald-500" />
            Sobriety Journey
          </div>
          <Badge className={substanceInfo.color}>
            {substanceInfo.emoji} {substanceInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10">
              <Flame className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">
                Day {journey.current_day}
              </div>
              <p className="text-sm text-muted-foreground">
                of {journey.target_days} day goal
              </p>
            </div>
          </div>
          
          {showChallengeButton && !isOwnProfile && onChallenge && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onChallenge}
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            >
              <Swords className="h-4 w-4 mr-1" />
              Challenge
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(journey.progress_percentage)}%</span>
          </div>
          <Progress 
            value={journey.progress_percentage} 
            className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-green-400" 
          />
        </div>

        {/* Check-ins */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{journey.total_checkins} daily check-ins completed</span>
        </div>

        {/* Milestone Badges */}
        {earnedMilestones.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Milestones Earned
            </div>
            <div className="flex flex-wrap gap-2">
              {earnedMilestones.map((milestone) => (
                <Badge 
                  key={milestone.days}
                  variant="secondary"
                  className="bg-yellow-500/10 text-yellow-600"
                >
                  {milestone.emoji} {milestone.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Milestone */}
        {journey.progress_percentage < 100 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              {(() => {
                const nextMilestone = MILESTONE_BADGES.find(m => journey.current_day < m.days);
                if (nextMilestone) {
                  const daysUntil = nextMilestone.days - journey.current_day;
                  return `${daysUntil} day${daysUntil !== 1 ? 's' : ''} until ${nextMilestone.label} milestone ${nextMilestone.emoji}`;
                }
                const daysUntilGoal = journey.target_days - journey.current_day;
                return `${daysUntilGoal} day${daysUntilGoal !== 1 ? 's' : ''} until goal completion! 🎉`;
              })()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
