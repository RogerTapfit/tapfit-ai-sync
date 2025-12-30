import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Flame, Activity, TrendingUp, TrendingDown, Share2, Layers } from "lucide-react";
import ShareRunModal from "@/components/run/ShareRunModal";
import { useRunsByIds } from "@/hooks/useRunHistory";
import { formatDistance, formatTime, formatPace } from "@/utils/runFormatters";
import { format } from "date-fns";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RunSession } from "@/types/run";
import { Badge } from "@/components/ui/badge";

// Merge multiple sessions into one for display
function mergeSessionsForSummary(sessions: RunSession[]): RunSession & { sessionCount: number } {
  if (sessions.length === 0) return null as any;
  if (sessions.length === 1) return { ...sessions[0], sessionCount: 1 };
  
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const totalDistance = sorted.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
  const totalTime = sorted.reduce((sum, s) => sum + (s.moving_time_s || 0), 0);
  const totalCalories = sorted.reduce((sum, s) => sum + (s.calories || 0), 0);
  const totalElevGain = sorted.reduce((sum, s) => sum + (s.elevation_gain_m || 0), 0);
  const totalElevLoss = sorted.reduce((sum, s) => sum + (s.elevation_loss_m || 0), 0);
  const allPoints = sorted.flatMap(s => s.points || []);
  const allSplits = sorted.flatMap(s => s.splits || []);
  const avgPace = totalDistance > 0 ? (totalTime / (totalDistance / 1000)) : 0;
  
  return {
    ...first,
    ended_at: last.ended_at,
    total_distance_m: totalDistance,
    moving_time_s: totalTime,
    calories: totalCalories,
    avg_pace_sec_per_km: avgPace,
    elevation_gain_m: totalElevGain,
    elevation_loss_m: totalElevLoss,
    points: allPoints,
    splits: allSplits,
    sessionCount: sorted.length,
  };
}

const RunSummary = () => {
  const { runId } = useParams<{ runId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get session IDs from query param, fallback to just runId
  const sessionIds = useMemo(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      return idsParam.split(',').filter(Boolean);
    }
    return runId ? [runId] : [];
  }, [searchParams, runId]);
  
  const { data: sessions, isLoading } = useRunsByIds(sessionIds);
  
  // Merge sessions for display
  const run = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return mergeSessionsForSummary(sessions);
  }, [sessions]);
  
  const [showShareModal, setShowShareModal] = useState(false);

  // Initialize map with the run route
  useEffect(() => {
    if (!run || run.points.length === 0) return;

    const mapContainer = document.getElementById('summary-map');
    if (!mapContainer) return;

    // Create map
    const map = L.map(mapContainer, {
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Add route
    const latLngs: L.LatLngExpression[] = run.points.map(p => [p.lat, p.lon]);
    const route = L.polyline(latLngs, {
      color: 'hsl(0, 84%, 60%)',
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    // Add start marker
    L.circleMarker(latLngs[0] as L.LatLngExpression, {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: 'hsl(142, 71%, 45%)',
      fillOpacity: 1,
    }).addTo(map);

    // Add end marker
    L.circleMarker(latLngs[latLngs.length - 1] as L.LatLngExpression, {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: 'hsl(0, 84%, 60%)',
      fillOpacity: 1,
    }).addTo(map);

    // Fit map to route
    map.fitBounds(route.getBounds(), { padding: [20, 20] });

    return () => {
      map.remove();
    };
  }, [run]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-safe">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <p className="text-muted-foreground">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-background p-4 pt-safe">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Run not found</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-safe">
      {/* Header */}
      <div className="bg-card border-b p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold">Run Summary</h1>
              {run.sessionCount > 1 && (
                <Badge variant="outline" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  {run.sessionCount} segments
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(run.started_at), "EEEE, MMM d 'at' h:mm a")}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowShareModal(true)}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Map */}
      {run.points.length > 0 && (
        <div id="summary-map" className="h-[40vh] w-full" />
      )}

      {/* Stats */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Primary Stat */}
        <Card className="p-6 text-center bg-gradient-to-br from-card to-accent">
          <div className="text-6xl font-bold text-foreground mb-2">
            {formatDistance(run.total_distance_m, run.unit)}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            Total Distance
          </div>
        </Card>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Moving Time</span>
            </div>
            <div className="text-2xl font-bold">
              {formatTime(run.moving_time_s)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Avg Pace</span>
            </div>
            <div className="text-2xl font-bold">
              {formatPace(run.avg_pace_sec_per_km, run.unit)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Calories</span>
            </div>
            <div className="text-2xl font-bold">{run.calories}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Splits</span>
            </div>
            <div className="text-2xl font-bold">{run.splits.length}</div>
          </Card>
        </div>

        {/* Elevation */}
        {(run.elevation_gain_m > 0 || run.elevation_loss_m > 0) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Elevation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">{Math.round(run.elevation_gain_m)}m</div>
                  <div className="text-xs text-muted-foreground">Gain</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-medium">{Math.round(run.elevation_loss_m)}m</div>
                  <div className="text-xs text-muted-foreground">Loss</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Splits */}
        {run.splits.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Splits</h3>
            <div className="space-y-2">
              {run.splits.map((split) => (
                <div
                  key={split.index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {split.index}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {run.unit === 'km' ? 'Kilometer' : 'Mile'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPace(split.avg_pace_sec_per_km, run.unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(split.duration_s)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/run/history')}
          >
            View All Runs
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate('/run/setup')}
          >
            Start New Run
          </Button>
        </div>

        {/* Share Modal */}
        <ShareRunModal 
          run={run} 
          open={showShareModal} 
          onOpenChange={setShowShareModal} 
        />
      </div>
    </div>
  );
};

export default RunSummary;
