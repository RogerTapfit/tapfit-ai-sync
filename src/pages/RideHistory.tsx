import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Bike, Calendar, Clock, MapPin } from 'lucide-react';
import { useRideHistory } from '@/hooks/useRideHistory';
import { formatDistance, formatSpeed } from '@/utils/cyclingMetrics';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

export default function RideHistory() {
  const navigate = useNavigate();
  const { data: rides, isLoading, error } = useRideHistory();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <>
      <SEO title="Ride History" description="View your past cycling workouts and performance" />
      <div className="min-h-screen bg-background pt-safe">
        {/* Header - safe area aware */}
        <div className="sticky z-10 bg-background/95 backdrop-blur border-b safe-header">
          <div className="flex items-center gap-2 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Ride History</span>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto p-4 space-y-4">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {error && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Failed to load ride history</p>
              </CardContent>
            </Card>
          )}

          {rides && rides.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Bike className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No rides yet</p>
                <Button onClick={() => navigate('/ride/setup')}>
                  Start Your First Ride
                </Button>
              </CardContent>
            </Card>
          )}

          {rides && rides.map((ride) => (
            <Card key={ride.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/ride/summary/${ride.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bike className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold capitalize">{ride.ride_type || 'Road'} Ride</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(ride.started_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatDistance(ride.total_distance_m, ride.unit)}</p>
                    <p className="text-xs text-muted-foreground">{ride.unit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(ride.moving_time_s)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Speed</p>
                    <p className="font-semibold">{formatSpeed(ride.avg_speed_kmh, ride.unit)} {ride.unit}/h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Elevation</p>
                    <p className="font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {Math.round(ride.elevation_gain_m || 0)}m
                    </p>
                  </div>
                </div>

                {ride.avg_heart_rate && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg HR: {ride.avg_heart_rate} BPM</span>
                    <span className="text-muted-foreground">{ride.calories || 0} cal</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
