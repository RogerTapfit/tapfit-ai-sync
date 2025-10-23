import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square, MapPin, Activity, Clock, Flame } from "lucide-react";
import { useRunTracker } from "@/hooks/useRunTracker";
import { RunMap } from "@/components/RunMap";
import { formatDistance, formatTime, formatPace } from "@/utils/runFormatters";
import { RunSettings } from "@/types/run";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const RunActive = () => {
  const navigate = useNavigate();
  const { metrics, status, startRun, pauseRun, resumeRun, stopRun } = useRunTracker();
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings] = useState<RunSettings>(() => {
    const stored = sessionStorage.getItem('runSettings');
    return stored ? JSON.parse(stored) : { unit: 'km', auto_pause: true, audio_cues: true };
  });

  useEffect(() => {
    // Wait for auth to be ready, then start tracking
    const initRun = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to track runs");
          navigate('/auth');
          return;
        }

        await startRun(settings);
        setIsInitialized(true);
        toast.success("GPS tracking started");
      } catch (error) {
        console.error('Failed to start run:', error);
        toast.error("Failed to start GPS tracking");
      }
    };

    if (status === 'idle' && !isInitialized) {
      initRun();
    }
  }, [status, isInitialized]);

  const handlePause = async () => {
    try {
      await pauseRun();
      toast.info("Run paused");
    } catch (error) {
      toast.error("Failed to pause run");
    }
  };

  const handleResume = async () => {
    try {
      await resumeRun();
      toast.success("Run resumed");
    } catch (error) {
      toast.error("Failed to resume run");
    }
  };

  const handleStop = async () => {
    try {
      const session = await stopRun();
      toast.success("Run completed!");
      navigate(`/run/summary/${session?.id}`);
    } catch (error) {
      toast.error("Failed to stop run");
    }
  };

  const isPaused = status === 'paused';
  const isRunning = status === 'running';

  return (
    <div className="min-h-screen bg-background">
      {/* Map Section */}
      <div className="h-[40vh] relative">
        <RunMap />
        
        {/* GPS Status Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Card className="px-3 py-2 bg-card/90 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                status === 'running' ? 'bg-green-500 animate-pulse' :
                status === 'acquiring_gps' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="text-xs font-medium">
                {status === 'running' ? 'Tracking' :
                 status === 'acquiring_gps' ? 'Acquiring GPS' :
                 status === 'paused' ? 'Paused' : 'Ready'}
              </span>
            </div>
          </Card>
          
          {metrics && (
            <Card className="px-3 py-2 bg-card/90 backdrop-blur">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium">
                  {metrics.gps_accuracy > 0 ? `±${Math.round(metrics.gps_accuracy)}m` : '--'}
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="p-4 space-y-4">
        {/* Primary Metric - Distance */}
        <Card className="p-6 text-center bg-gradient-to-br from-card to-accent">
          <div className="text-6xl font-bold text-foreground mb-2">
            {metrics ? formatDistance(metrics.distance_m, settings.unit) : '0.00 km'}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            Distance
          </div>
        </Card>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Time */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Time</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics ? formatTime(metrics.moving_time_s) : '0:00'}
            </div>
          </Card>

          {/* Pace */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Avg Pace</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics ? formatPace(metrics.avg_pace_sec_per_km, settings.unit) : '--:--'}
            </div>
          </Card>

          {/* Calories */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Calories</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics?.calories || 0}
            </div>
          </Card>

          {/* Split */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Split</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics?.current_split || 0}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex gap-3 pt-4">
          {isPaused || isRunning ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={isPaused ? handleResume : handlePause}
                className="flex-1"
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleStop}
                className="flex-1"
              >
                <Square className="h-5 w-5 mr-2" />
                Finish
              </Button>
            </>
          ) : (
            <div className="flex-1 text-center text-muted-foreground py-4">
              Initializing GPS...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunActive;
