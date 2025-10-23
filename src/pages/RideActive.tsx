import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Home, Play, Pause, StopCircle, X, Bike, Gauge, MapPin, Clock, Flame, TrendingUp, Heart } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-green-500/5">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b animate-fade-in">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleNavigateAway('setup')} className="hover-scale">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <Bike className="h-4 w-4 text-green-500" />
                </div>
                <span className="font-semibold">Active Ride</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleNavigateAway('home')} className="hover-scale">
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="h-[40vh] relative overflow-hidden animate-fade-in">
          <RunMap />
          
          {/* Status Badge Overlay */}
          <div className="absolute top-4 left-4">
            <Card className="px-3 py-2 bg-card/90 backdrop-blur border-green-500/20 shadow-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'riding' ? 'bg-green-500 animate-pulse' :
                  status === 'acquiring_gps' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-xs font-medium capitalize">{status}</span>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* Primary Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-green-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Gauge className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{formatSpeed(metrics?.current_speed_kmh || 0, 'km')}</p>
                <p className="text-xs text-muted-foreground">km/h</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MapPin className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{formatDistance(metrics?.distance_m || 0, 'km')}</p>
                <p className="text-xs text-muted-foreground">km</p>
              </CardContent>
            </Card>
            <Card className="border-purple-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{formatTime(metrics?.moving_time_s || 0)}</p>
                <p className="text-xs text-muted-foreground">time</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-cyan-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-cyan-500/10">
                    <Gauge className="h-3 w-3 text-cyan-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Speed</p>
                </div>
                <p className="text-xl font-semibold">{formatSpeed(metrics?.avg_speed_kmh || 0, 'km')} km/h</p>
              </CardContent>
            </Card>
            <Card className="border-orange-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-orange-500/10">
                    <Flame className="h-3 w-3 text-orange-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Calories</p>
                </div>
                <p className="text-xl font-semibold">{metrics?.calories || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Elevation</p>
                </div>
                <p className="text-xl font-semibold">{Math.round(metrics?.elevation_gain_m || 0)}m</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-yellow-500/10">
                    <MapPin className="h-3 w-3 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">GPS</p>
                </div>
                <p className="text-xl font-semibold">{Math.round(metrics?.gps_accuracy || 0)}m</p>
              </CardContent>
            </Card>
          </div>

          {/* Heart Rate Zone */}
          {metrics?.current_bpm && (
            <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20 hover:shadow-lg transition-all duration-300 animate-fade-in">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-500/10">
                      <Heart className="h-4 w-4 text-red-500 animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-red-500">{metrics.current_bpm} <span className="text-sm font-normal">BPM</span></p>
                </div>
                {metrics.zone_status && (
                  <>
                    <Progress value={metrics.time_in_zone_s || 0} max={100} className={getZoneColor(metrics.zone_status)} />
                    <p className="text-xs text-center font-medium">{getZoneMessage(metrics.zone_status)}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="space-y-3 pt-4 animate-fade-in">
            <div className="flex gap-3">
              {status === 'riding' ? (
                <Button variant="outline" size="lg" className="flex-1 hover-scale border-green-500/20 hover:border-green-500/40" onClick={handlePause}>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              ) : status === 'paused' ? (
                <Button variant="outline" size="lg" className="flex-1 hover-scale border-green-500/20 hover:border-green-500/40" onClick={handleResume}>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : null}

              {(status === 'riding' || status === 'paused') && (
                <Button size="lg" className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover-scale" onClick={handleFinish}>
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
