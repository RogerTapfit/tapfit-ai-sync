import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, StopCircle, Waves, Timer, Ruler, Flame, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSwimTracker } from '@/hooks/useSwimTracker';
import { useHeartRate } from '@/hooks/useHeartRate';
import { toast } from 'sonner';
import { getCoachingCue, getZoneColor } from '@/utils/heartRateZones';

export default function SwimActive() {
  const navigate = useNavigate();
  const { metrics, status, pause, resume, completeLap, complete, abandon, updateHeartRate } = useSwimTracker();
  const { bpm, start: startHR, stop: stopHR } = useHeartRate();

  useEffect(() => {
    if (status === 'idle') {
      navigate('/swim/setup');
    }
  }, [status, navigate]);

  useEffect(() => {
    startHR('swimming');
    return () => stopHR();
  }, [startHR, stopHR]);

  useEffect(() => {
    if (bpm) {
      updateHeartRate(bpm);
    }
  }, [bpm, updateHeartRate]);

  const handlePauseResume = () => {
    if (status === 'swimming') {
      pause();
      toast.info('Swim paused');
    } else if (status === 'paused') {
      resume();
      toast.success('Swim resumed');
    }
  };

  const handleCompleteLap = () => {
    completeLap();
    toast.success('Lap completed!');
  };

  const handleFinish = async () => {
    try {
      const sessionId = await complete();
      toast.success('Swim completed!');
      navigate(`/swim/summary/${sessionId}`);
    } catch (error) {
      console.error('Failed to finish swim:', error);
      toast.error('Failed to save swim');
    }
  };

  const handleAbandon = () => {
    if (confirm('Are you sure you want to abandon this swim?')) {
      abandon();
      toast.info('Swim abandoned');
      navigate('/');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (secPer100m: number): string => {
    if (!secPer100m || secPer100m === Infinity) return '--:--';
    const mins = Math.floor(secPer100m / 60);
    const secs = Math.floor(secPer100m % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'idle') return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 pb-20">
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAbandon}
            className="hover-scale"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Swimming</h1>
          </div>
          <Badge variant={status === 'swimming' ? 'default' : 'secondary'} className="animate-pulse">
            {status}
          </Badge>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center border-blue-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="p-2 mx-auto w-fit rounded-lg bg-blue-500/10 mb-2">
              <Timer className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{formatTime(metrics.moving_time_s)}</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </Card>

          <Card className="p-4 text-center border-cyan-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="p-2 mx-auto w-fit rounded-lg bg-cyan-500/10 mb-2">
              <Ruler className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="text-3xl font-bold">{Math.round(metrics.distance_m)}</div>
            <div className="text-xs text-muted-foreground">Meters</div>
          </Card>

          <Card className="p-4 text-center border-purple-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="p-2 mx-auto w-fit rounded-lg bg-purple-500/10 mb-2">
              <Waves className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold">{metrics.total_laps}</div>
            <div className="text-xs text-muted-foreground">Laps</div>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-green-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Timer className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{formatPace(metrics.avg_pace_sec_per_100m)}</div>
                <div className="text-xs text-muted-foreground">Avg Pace /100m</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-orange-500/20 hover:shadow-lg transition-all animate-fade-in hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{metrics.calories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Heart Rate Zone */}
        {metrics.current_bpm && (
          <Card className="p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20 hover:shadow-lg transition-all animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{metrics.current_bpm}</div>
                  <div className="text-sm text-muted-foreground">BPM</div>
                </div>
              </div>
              {metrics.zone_status && (
                <Badge
                  style={{
                    backgroundColor: getZoneColor(metrics.zone_status),
                    color: 'white',
                  }}
                >
                  {getCoachingCue(metrics.zone_status)}
                </Badge>
              )}
            </div>
            {metrics.avg_bpm && (
              <div className="text-sm text-muted-foreground">
                Avg: {metrics.avg_bpm} BPM
              </div>
            )}
          </Card>
        )}

        {/* Complete Lap Button */}
        <Button
          onClick={handleCompleteLap}
          disabled={status !== 'swimming'}
          className="w-full h-16 text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg hover-scale"
        >
          <Plus className="h-6 w-6 mr-2" />
          Complete Lap
        </Button>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handlePauseResume}
            variant="outline"
            className="h-14 border-blue-500/20 hover-scale"
          >
            {status === 'swimming' ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Resume
              </>
            )}
          </Button>

          <Button
            onClick={handleFinish}
            className="h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover-scale"
          >
            <StopCircle className="h-5 w-5 mr-2" />
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
