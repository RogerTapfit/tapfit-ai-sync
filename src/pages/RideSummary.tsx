import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bike, Clock, MapPin, Heart, Flame } from 'lucide-react';
import { useRideById } from '@/hooks/useRideById';
import { formatDistance, formatSpeed } from '@/utils/cyclingMetrics';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { RunMap } from '@/components/RunMap';
import SEO from '@/components/SEO';

export default function RideSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ride, isLoading, error } = useRideById(id);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-2 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ride/history')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Ride Summary</span>
          </div>
        </div>
        <div className="container max-w-2xl mx-auto p-4 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-2 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ride/history')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Ride Summary</span>
          </div>
        </div>
        <div className="container max-w-2xl mx-auto p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Ride not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Ride Summary" description="Detailed summary of your cycling workout" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-2 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ride/history')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Ride Summary</span>
          </div>
        </div>

        {/* Map */}
        <div className="h-[40vh] relative bg-muted">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Route map</p>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto p-4 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold capitalize">{ride.ride_type || 'Road'} Ride</h1>
            </div>
            <p className="text-muted-foreground">{format(new Date(ride.started_at), 'EEEE, MMMM d, yyyy • h:mm a')}</p>
          </div>

          {/* Primary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-3xl font-bold">{formatDistance(ride.total_distance_m, ride.unit)}</p>
                <p className="text-xs text-muted-foreground uppercase">{ride.unit}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-3xl font-bold">{formatTime(ride.moving_time_s)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-3xl font-bold">{formatSpeed(ride.avg_speed_kmh, ride.unit)}</p>
                <p className="text-xs text-muted-foreground">{ride.unit}/h</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Speed</p>
                  <p className="text-xl font-semibold">{formatSpeed(ride.max_speed_kmh, ride.unit)} {ride.unit}/h</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Elevation Gain</p>
                  <p className="text-xl font-semibold">{Math.round(ride.elevation_gain_m || 0)}m</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calories</p>
                  <p className="text-xl font-semibold">{ride.calories || 0}</p>
                </div>
              </div>
              {ride.avg_heart_rate && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
                    <p className="text-xl font-semibold">{ride.avg_heart_rate} BPM</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Splits */}
          {ride.splits && ride.splits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Splits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ride.splits.map((split) => (
                    <div key={split.index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="font-medium">{split.index * 5} km</span>
                      <span className="text-muted-foreground">{formatSpeed(split.avg_speed_kmh, ride.unit)} {ride.unit}/h</span>
                      <span className="text-muted-foreground">{formatTime(split.duration_s)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/ride/setup')}>
              Ride Again
            </Button>
            <Button className="flex-1" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
