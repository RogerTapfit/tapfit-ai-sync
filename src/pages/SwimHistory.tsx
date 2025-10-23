import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Waves, Timer, Ruler, Flame, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSwimHistory } from '@/hooks/useSwimHistory';
import { format } from 'date-fns';

export default function SwimHistory() {
  const navigate = useNavigate();
  const { data: swims, isLoading } = useSwimHistory();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 pb-20">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover-scale"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Swim History</h1>
              <p className="text-sm text-muted-foreground">
                {swims?.length || 0} swim sessions
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading swim history...</p>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!swims || swims.length === 0) && (
          <Card className="p-8 text-center border-blue-500/20">
            <Waves className="h-16 w-16 mx-auto mb-4 text-blue-500/50" />
            <h3 className="text-lg font-semibold mb-2">No Swims Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start your first swim session to see it here
            </p>
            <Button onClick={() => navigate('/swim/setup')} className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Waves className="h-4 w-4 mr-2" />
              Start Swimming
            </Button>
          </Card>
        )}

        {/* Swim List */}
        {!isLoading && swims && swims.length > 0 && (
          <div className="space-y-3">
            {swims.map((swim) => (
              <Card
                key={swim.id}
                className="p-5 hover:shadow-lg transition-all cursor-pointer border-blue-500/20 hover-scale animate-fade-in"
                onClick={() => navigate(`/swim/summary/${swim.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Waves className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold capitalize">
                        {swim.stroke_type || 'Freestyle'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(swim.started_at), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                      <Ruler className="h-3 w-3" />
                    </div>
                    <div className="font-bold">{Math.round(swim.total_distance_m)}m</div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-cyan-500 mb-1">
                      <Timer className="h-3 w-3" />
                    </div>
                    <div className="font-bold">{formatTime(swim.moving_time_s)}</div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                      <Waves className="h-3 w-3" />
                    </div>
                    <div className="font-bold">{swim.total_laps || 0}</div>
                    <div className="text-xs text-muted-foreground">Laps</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                      <Flame className="h-3 w-3" />
                    </div>
                    <div className="font-bold">{swim.calories}</div>
                    <div className="text-xs text-muted-foreground">Cal</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Start New Swim Button */}
        <Button
          onClick={() => navigate('/swim/setup')}
          className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover-scale"
        >
          <Waves className="h-5 w-5 mr-2" />
          Start New Swim
        </Button>
      </div>
    </div>
  );
}
