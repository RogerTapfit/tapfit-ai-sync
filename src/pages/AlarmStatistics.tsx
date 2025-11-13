import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAlarmStats } from '@/hooks/useAlarmStats';
import { ArrowLeft, TrendingUp, Clock, Flame, Trophy, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AlarmStatistics() {
  const navigate = useNavigate();
  const { stats, isLoading } = useAlarmStats();

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/fitness-alarm')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Alarm Statistics</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Completions</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.totalCompletions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completionRate}% completion rate
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Avg Time</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatTime(stats.averageTimeToComplete)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per alarm</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Current Streak</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">Days in a row</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Best Streak</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.longestStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">Days total</p>
          </Card>
        </div>

        {/* Performance by Alarm */}
        {Object.keys(stats.completionsByAlarm).length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Performance by Alarm</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(stats.completionsByAlarm).map(([alarmId, data]) => (
                <div key={alarmId} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{data.alarmLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.completions} completion{data.completions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatTime(data.avgTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">avg time</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent History */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Recent Completions</h2>
          {stats.recentCompletions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No completions yet. Complete your first alarm to see your progress!
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentCompletions.map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {completion.alarm?.label || 'Unnamed Alarm'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(completion.completed_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      💪 {completion.push_ups_completed} push-ups
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(completion.time_to_complete)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Motivational Section */}
        {stats.currentStreak > 0 && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="text-center">
              <div className="text-6xl mb-3">🔥</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {stats.currentStreak} Day Streak!
              </h3>
              <p className="text-muted-foreground">
                {stats.currentStreak === stats.longestStreak
                  ? "You're on fire! This is your best streak yet!"
                  : `Keep going! Your record is ${stats.longestStreak} days.`}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
