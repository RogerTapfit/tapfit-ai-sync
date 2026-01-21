import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square, MapPin, Activity, Clock, Flame, Heart, Home, ArrowLeft, X, Footprints } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRunTracker } from "@/hooks/useRunTracker";
import { RunMap } from "@/components/RunMap";
import { formatDistance, formatTime, formatPace } from "@/utils/runFormatters";
import { RunSettings } from "@/types/run";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RunGPSWarningBanner } from "@/components/RunGPSWarningBanner";
import { getCoachingCue, getZoneColor } from "@/utils/heartRateZones";
import { runTrackerService } from "@/services/runTrackerService";
import { GPSSignalIndicator } from "@/components/GPSSignalIndicator";
import { RunCompletionCelebration } from "@/components/run/RunCompletionCelebration";

const RunActive = () => {
  const navigate = useNavigate();
  const { metrics, status, startRun, pauseRun, resumeRun, stopRun } = useRunTracker();
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings] = useState<RunSettings>(() => {
    const stored = sessionStorage.getItem('runSettings');
    return stored ? JSON.parse(stored) : { activity_type: 'run', unit: 'km', auto_pause: true, audio_cues: true };
  });
  
  const isWalk = settings.activity_type === 'walk';
  const activityName = isWalk ? 'Walk' : 'Run';
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelDestination, setCancelDestination] = useState<'setup' | 'home'>('setup');
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  
  // Live timer that updates every second
  const [liveTime, setLiveTime] = useState(0);
  
  // Get session for HR zone info
  const session = runTrackerService.getState()?.session;

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

  // Live timer effect - updates every second
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (status === 'running') {
      // Only sync with metrics when running (not when paused)
      if (metrics?.moving_time_s !== undefined) {
        setLiveTime(Math.floor(metrics.moving_time_s));
      }
      
      interval = setInterval(() => {
        setLiveTime((prev) => prev + 1);
      }, 1000);
    }
    // When paused - do nothing, liveTime keeps its current value
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, metrics?.moving_time_s]);

  const handlePause = async () => {
    try {
      await pauseRun();
      toast.info(`${activityName} paused`);
    } catch (error) {
      toast.error(`Failed to pause ${activityName.toLowerCase()}`);
    }
  };

  const handleResume = async () => {
    try {
      await resumeRun();
      toast.success(`${activityName} resumed`);
    } catch (error) {
      toast.error(`Failed to resume ${activityName.toLowerCase()}`);
    }
  };

  const handleStop = async () => {
    try {
      const session = await stopRun();
      if (session?.id) {
        setCompletedSessionId(session.id);
        setShowCelebration(true);
      } else {
        navigate('/run/setup');
      }
    } catch (error) {
      toast.error(`Failed to stop ${activityName.toLowerCase()}`);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    if (completedSessionId) {
      // Replace history entry so the user doesn't get sent back to this screen
      // (which would auto-start tracking again).
      navigate(`/run/summary/${completedSessionId}`, { replace: true });
    }
  };

  const handleNavigateAway = (destination: 'setup' | 'home') => {
    if (status === 'running' || status === 'paused') {
      setCancelDestination(destination);
      setShowCancelDialog(true);
    } else {
      // If not started yet, navigate freely
      navigate(destination === 'home' ? '/' : '/run/setup');
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await stopRun();
      toast.info(`${activityName} cancelled`);
      navigate(cancelDestination === 'home' ? '/' : '/run/setup');
    } catch (error) {
      console.error(`Failed to cancel ${activityName.toLowerCase()}:`, error);
      toast.error(`Failed to cancel ${activityName.toLowerCase()}`);
    }
    setShowCancelDialog(false);
  };

  const isPaused = status === 'paused';
  const isRunning = status === 'running';

  return (
    <div className={`min-h-screen bg-gradient-to-b from-background via-background ${isWalk ? 'to-green-500/5' : 'to-blue-500/5'}`}>
      {/* Celebration Modal */}
      {showCelebration && metrics && (
        <RunCompletionCelebration
          distance_m={metrics.distance_m}
          moving_time_s={metrics.moving_time_s}
          avg_pace_sec_per_km={metrics.avg_pace_sec_per_km}
          calories={metrics.calories}
          activityType={settings.activity_type}
          unit={settings.unit}
          onComplete={handleCelebrationComplete}
        />
      )}

      {/* Header with Navigation - safe area aware */}
      <div className="sticky z-10 bg-background/95 backdrop-blur border-b animate-fade-in safe-header">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigateAway('setup')}
              className="hover-scale"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isWalk ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                {isWalk ? (
                  <Footprints className="h-4 w-4 text-green-500" />
                ) : (
                  <Activity className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <span className="font-semibold">Active {activityName}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigateAway('home')}
            className="hover-scale"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Map Section */}
      <div className="h-[40vh] relative overflow-hidden animate-fade-in">
        <RunMap />
        
        {/* GPS Status Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Card className="px-3 py-2 bg-card/90 backdrop-blur border-blue-500/20 shadow-lg">
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
            <GPSSignalIndicator accuracy={metrics.gps_accuracy} />
          )}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="p-4 space-y-4">
        {/* GPS Warning Banner */}
        <RunGPSWarningBanner />

        {/* Primary Metric - Distance */}
        <Card className="p-6 text-center bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in">
          <div className="text-6xl font-bold text-foreground mb-2">
            {metrics ? formatDistance(metrics.distance_m, settings.unit) : '0.00 km'}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            Distance
          </div>
        </Card>

        {/* Heart Rate Zone Indicator */}
        {metrics && session?.training_mode !== 'pace_based' && session?.target_hr_zone && (
          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Heart Rate</span>
                <div className="p-1.5 rounded-lg bg-red-500/10">
                  <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
              </div>
              <div className="text-4xl font-bold text-red-500">
                {metrics.current_bpm || '--'} <span className="text-lg">bpm</span>
              </div>
              
              {/* Target Zone */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Target: {session.target_hr_zone.zone_name}</span>
                  <span>{session.target_hr_zone.min_bpm}-{session.target_hr_zone.max_bpm} bpm</span>
                </div>
                
                {/* HR Zone Progress Bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      backgroundColor: metrics.zone_status ? getZoneColor(metrics.zone_status) : 'hsl(var(--muted))',
                      width: `${Math.min(100, Math.max(0, ((metrics.current_bpm || 0) / session.target_hr_zone.max_bpm) * 100))}%` 
                    }}
                  />
                </div>

                {/* Coaching Cue */}
                {metrics.zone_status && (
                  <div 
                    className="text-center text-sm font-medium"
                    style={{ color: getZoneColor(metrics.zone_status) }}
                  >
                    {getCoachingCue(metrics.zone_status)}
                  </div>
                )}
              </div>

              {/* Time in Zone */}
              {metrics.time_in_zone_s !== undefined && (
                <div className="text-xs text-muted-foreground text-center">
                  Time in zone: {formatTime(metrics.time_in_zone_s)}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Time */}
          <Card className="p-4 border-purple-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-lg bg-purple-500/10">
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-xs text-muted-foreground">Time</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {formatTime(liveTime)}
            </div>
          </Card>

          {/* Pace */}
          <Card className="p-4 border-green-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-lg bg-green-500/10">
                <Activity className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">Avg Pace</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics ? formatPace(metrics.avg_pace_sec_per_km, settings.unit) : '--:--'}
            </div>
          </Card>

          {/* Calories */}
          <Card className="p-4 border-orange-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-lg bg-orange-500/10">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-xs text-muted-foreground">Calories</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics?.calories || 0}
            </div>
          </Card>

          {/* Split */}
          <Card className="p-4 border-blue-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-lg bg-blue-500/10">
                <MapPin className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">Split</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics?.current_split || 0}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-3 pt-4 animate-fade-in">
          <div className="flex gap-3">
            {isPaused || isRunning ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={isPaused ? handleResume : handlePause}
                  className="flex-1 hover-scale border-blue-500/20 hover:border-blue-500/40"
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
                  size="lg"
                  onClick={handleStop}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover-scale"
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

          {/* Cancel Option */}
          {(isPaused || isRunning) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigateAway('setup')}
              className="w-full text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel {activityName}
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon {activityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current {activityName.toLowerCase()} data will be lost if you leave now.
              {status === 'running' && ` Your ${activityName.toLowerCase()} is still active.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Here</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End {activityName}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RunActive;
