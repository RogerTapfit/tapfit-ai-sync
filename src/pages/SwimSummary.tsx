import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Waves, Timer, Ruler, Flame, TrendingUp, Heart, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSwimById } from '@/hooks/useSwimById';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SwimSummary() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: swim, isLoading, error } = useSwimById(id);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (secPer100m: number): string => {
    if (!secPer100m || secPer100m === Infinity) return '--:--';
    const mins = Math.floor(secPer100m / 60);
    const secs = Math.floor(secPer100m % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    toast.success('Share functionality coming soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 flex items-center justify-center pt-safe">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading swim summary...</p>
        </Card>
      </div>
    );
  }

  if (error || !swim) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 flex items-center justify-center p-4 pt-safe">
        <Card className="p-8 text-center max-w-md">
          <Waves className="h-16 w-16 mx-auto mb-4 text-blue-500/50" />
          <h3 className="text-lg font-semibold mb-2">Swim Not Found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Could not load the swim session details
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 pb-20 pt-safe">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/swim/history')}
            className="hover-scale"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold capitalize">{swim.stroke_type || 'Freestyle'}</h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(swim.started_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} className="hover-scale">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 text-center border-blue-500/20 hover:shadow-lg transition-all animate-fade-in">
            <div className="p-3 mx-auto w-fit rounded-lg bg-blue-500/10 mb-3">
              <Ruler className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{Math.round(swim.total_distance_m)}</div>
            <div className="text-sm text-muted-foreground">Meters</div>
          </Card>

          <Card className="p-6 text-center border-cyan-500/20 hover:shadow-lg transition-all animate-fade-in">
            <div className="p-3 mx-auto w-fit rounded-lg bg-cyan-500/10 mb-3">
              <Timer className="h-8 w-8 text-cyan-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{formatTime(swim.moving_time_s)}</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-purple-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Waves className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{swim.total_laps || 0}</div>
                <div className="text-xs text-muted-foreground">Total Laps</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-green-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{formatPace(swim.avg_pace_sec_per_100m)}</div>
                <div className="text-xs text-muted-foreground">Avg Pace /100m</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-orange-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{swim.calories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
            </div>
          </Card>

          {swim.avg_heart_rate && (
            <Card className="p-4 border-red-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold">{swim.avg_heart_rate}</div>
                  <div className="text-xs text-muted-foreground">Avg HR</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Lap Breakdown */}
        {swim.laps && swim.laps.length > 0 && (
          <Card className="p-6 border-blue-500/20 hover:shadow-lg transition-all animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Lap Breakdown</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {swim.laps.map((lap) => (
                <div
                  key={lap.index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-muted-foreground w-16">
                      Lap {lap.index}
                    </div>
                    <div className="text-sm">{formatPace(lap.avg_pace_sec_per_100m)} /100m</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(lap.duration_s)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/swim/history')}
            className="h-12 hover-scale"
          >
            View History
          </Button>
          <Button
            onClick={() => navigate('/swim/setup')}
            className="h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover-scale"
          >
            <Waves className="h-5 w-5 mr-2" />
            Swim Again
          </Button>
        </div>
      </div>
    </div>
  );
}
