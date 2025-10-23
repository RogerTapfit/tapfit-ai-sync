import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Home, Play, Pause, StopCircle, X } from 'lucide-react';
import { useRideTracker } from '@/hooks/useRideTracker';
import { RideSettings } from '@/types/ride';
import { toast } from 'sonner';
import { formatDistance, formatSpeed } from '@/utils/cyclingMetrics';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { RunMap } from '@/components/RunMap';
import SEO from '@/components/SEO';

export default function RideActive() {
  const navigate = useNavigate();
  const { metrics, status, startRide, pauseRide, resumeRide, stopRide } = useRideTracker();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelDestination, setCancelDestination] = useState<'setup' | 'home'>('setup');

  useEffect(() => {
    const settingsStr = localStorage.getItem('ride_settings');
    if (!settingsStr) {
      toast.error('No ride settings found');
      navigate('/ride/setup');
      return;
    }

    const settings: RideSettings = JSON.parse(settingsStr);
    startRide(settings).catch((error) => {
      toast.error(error.message || 'Failed to start ride');
      navigate('/ride/setup');
    });
  }, []);

  const handleNavigateAway = (destination: 'setup' | 'home') => {
    if (status === 'riding' || status === 'paused') {
      setCancelDestination(destination);
      setShowCancelDialog(true);
    } else {
      navigate(destination === 'home' ? '/' : '/ride/setup');
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await stopRide();
      toast.info('Ride cancelled');
      navigate(cancelDestination === 'home' ? '/' : '/ride/setup');
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      toast.error('Failed to cancel ride');
    }
    setShowCancelDialog(false);
  };

  const handlePause = async () => {
    try {
      await pauseRide();
      toast.info('Ride paused');
    } catch (error) {
      toast.error('Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      await resumeRide();
      toast.success('Ride resumed');
    } catch (error) {
      toast.error('Failed to resume');
    }
  };

  const handleFinish = async () => {
    try {
      const session = await stopRide();
      if (session) {
        toast.success('Ride completed!');
        navigate(`/ride/summary/${session.id}`);
      }
    } catch (error) {
      toast.error('Failed to finish ride');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getZoneColor = (zoneStatus?: 'below' | 'in_zone' | 'above') => {
    if (!zoneStatus) return 'bg-muted';
    switch (zoneStatus) {
      case 'below': return 'bg-blue-500';
      case 'in_zone': return 'bg-green-500';
      case 'above': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getZoneMessage = (zoneStatus?: 'below' | 'in_zone' | 'above') => {
    if (!zoneStatus) return '';
    switch (zoneStatus) {
      case 'below': return '🚴 Pedal harder to reach zone';
      case 'in_zone': return '✅ Perfect! Maintain this effort';
      case 'above': return '🚶 Ease up a bit';
      default: return '';
    }
  };

  return (
    <>
      <SEO title="Active Ride" description="Live cycling workout with GPS and heart rate tracking" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleNavigateAway('setup')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="font-semibold">Active Ride</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleNavigateAway('home')}>
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="h-[40vh] relative">
          <RunMap />
        </div>

        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground capitalize">{status}</p>
          </div>

          {/* Primary Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{formatSpeed(metrics?.current_speed_kmh || 0, 'km')}</p>
                <p className="text-xs text-muted-foreground">km/h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{formatDistance(metrics?.distance_m || 0, 'km')}</p>
                <p className="text-xs text-muted-foreground">km</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{formatTime(metrics?.moving_time_s || 0)}</p>
                <p className="text-xs text-muted-foreground">time</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Avg Speed</p>
                <p className="text-xl font-semibold">{formatSpeed(metrics?.avg_speed_kmh || 0, 'km')} km/h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-xl font-semibold">{metrics?.calories || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Elevation</p>
                <p className="text-xl font-semibold">{Math.round(metrics?.elevation_gain_m || 0)}m</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">GPS</p>
                <p className="text-xl font-semibold">{Math.round(metrics?.gps_accuracy || 0)}m</p>
              </CardContent>
            </Card>
          </div>

          {/* Heart Rate Zone */}
          {metrics?.current_bpm && (
            <Card>
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-2xl font-bold">{metrics.current_bpm} <span className="text-sm font-normal">BPM</span></p>
                </div>
                {metrics.zone_status && (
                  <>
                    <Progress value={metrics.time_in_zone_s || 0} max={100} className={getZoneColor(metrics.zone_status)} />
                    <p className="text-xs text-center">{getZoneMessage(metrics.zone_status)}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              {status === 'riding' ? (
                <Button variant="secondary" size="lg" className="flex-1" onClick={handlePause}>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              ) : status === 'paused' ? (
                <Button variant="secondary" size="lg" className="flex-1" onClick={handleResume}>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : null}

              {(status === 'riding' || status === 'paused') && (
                <Button size="lg" className="flex-1" onClick={handleFinish}>
                  <StopCircle className="h-5 w-5 mr-2" />
                  Finish
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={() => handleNavigateAway('setup')} className="w-full text-muted-foreground">
              <X className="h-4 w-4 mr-2" />
              Cancel Ride
            </Button>
          </div>
        </div>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Abandon Ride?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current ride data will be lost if you leave now.
                {status === 'riding' && ' Your ride is still active.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay Here</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                End Ride
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
