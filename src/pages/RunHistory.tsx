import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Flame, Activity, Play, Layers } from "lucide-react";
import { useRunHistory } from "@/hooks/useRunHistory";
import { formatDistance, formatTime, formatPace } from "@/utils/runFormatters";
import { format } from "date-fns";
import { MiniRoutePreview } from "@/components/MiniRoutePreview";
import { Badge } from "@/components/ui/badge";
import { mergeConsecutiveSessions } from "@/utils/mergeRunSessions";
const RunHistory = () => {
  const navigate = useNavigate();
  const { data: runs, isLoading } = useRunHistory();
  
  // Merge sessions with < 10 min gaps
  const mergedRuns = useMemo(() => 
    mergeConsecutiveSessions(runs || [], 10), 
    [runs]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-safe">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <p className="text-muted-foreground">Loading runs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20 pt-safe">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Run History</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Runs List */}
        {mergedRuns.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No runs recorded yet</p>
            <Button onClick={() => navigate('/run/setup')}>
              Start Your First Run
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {mergedRuns.map((run) => (
              <Card
                key={run.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/run/summary/${run.id}`)}
              >
                {/* Route preview map */}
                {run.points && run.points.length >= 2 && (
                  <MiniRoutePreview 
                    points={run.points} 
                    className="h-32 w-full"
                  />
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {format(new Date(run.started_at), "EEEE, MMM d")}
                        </h3>
                        {run.status === 'active' && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                            <Play className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {run.sessionCount > 1 && (
                          <Badge variant="outline" className="text-xs">
                            <Layers className="h-3 w-3 mr-1" />
                            {run.sessionCount} segments
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(run.started_at), "h:mm a")}
                        {run.activity_type && (
                          <span className="ml-2 capitalize">• {run.activity_type}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatDistance(run.total_distance_m, run.unit)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">{formatTime(run.moving_time_s)}</div>
                        <div className="text-xs text-muted-foreground">Time</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="font-medium">
                          {formatPace(run.avg_pace_sec_per_km, run.unit)}
                        </div>
                        <div className="text-xs text-muted-foreground">Pace</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-medium">{run.calories || 0}</div>
                        <div className="text-xs text-muted-foreground">Cal</div>
                      </div>
                    </div>
                  </div>

                  {run.splits && run.splits.length > 0 && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{run.splits.length} splits completed</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunHistory;
