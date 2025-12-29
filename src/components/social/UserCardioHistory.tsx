import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footprints, Waves, Clock, Flame, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CardioSession {
  id: string;
  type: 'run' | 'walk' | 'swim';
  distance_m: number;
  duration_s: number;
  calories: number | null;
  date: string;
  pace?: number | null;
  laps?: number | null;
}

interface UserCardioHistoryProps {
  userId: string;
}

export const UserCardioHistory = ({ userId }: UserCardioHistoryProps) => {
  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCardioHistory();
  }, [userId]);

  const fetchCardioHistory = async () => {
    setLoading(true);
    try {
      // Fetch run sessions
      const { data: runs } = await supabase
        .from('run_sessions')
        .select('id, total_distance_m, moving_time_s, calories, started_at, avg_pace_sec_per_km, activity_type')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(20);

      // Fetch swim sessions
      const { data: swims } = await supabase
        .from('swim_sessions')
        .select('id, total_distance_m, moving_time_s, calories, started_at, total_laps')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(20);

      const allSessions: CardioSession[] = [
        ...(runs || []).map(r => ({
          id: r.id,
          type: (r.activity_type === 'walk' ? 'walk' : 'run') as 'run' | 'walk',
          distance_m: Number(r.total_distance_m),
          duration_s: r.moving_time_s,
          calories: r.calories,
          date: r.started_at,
          pace: r.avg_pace_sec_per_km
        })),
        ...(swims || []).map(s => ({
          id: s.id,
          type: 'swim' as const,
          distance_m: Number(s.total_distance_m),
          duration_s: s.moving_time_s,
          calories: s.calories,
          date: s.started_at,
          laps: s.total_laps
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSessions(allSessions);
    } catch (error) {
      console.error('Error fetching cardio history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatPace = (secPerKm: number | null | undefined): string => {
    if (!secPerKm) return '--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  const getActivityIcon = (type: 'run' | 'walk' | 'swim') => {
    switch (type) {
      case 'run':
        return <Footprints className="h-5 w-5 text-blue-500" />;
      case 'walk':
        return <Footprints className="h-5 w-5 text-green-500" />;
      case 'swim':
        return <Waves className="h-5 w-5 text-cyan-500" />;
    }
  };

  const getActivityLabel = (type: 'run' | 'walk' | 'swim') => {
    switch (type) {
      case 'run': return 'Run';
      case 'walk': return 'Walk';
      case 'swim': return 'Swim';
    }
  };

  const getActivityColor = (type: 'run' | 'walk' | 'swim') => {
    switch (type) {
      case 'run': return 'bg-blue-500/10 text-blue-500';
      case 'walk': return 'bg-green-500/10 text-green-500';
      case 'swim': return 'bg-cyan-500/10 text-cyan-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Footprints className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No cardio activities yet</p>
        <p className="text-sm mt-1">Runs, walks, and swims will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {getActivityIcon(session.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={getActivityColor(session.type)}>
                    {getActivityLabel(session.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(session.date), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatDistance(session.distance_m)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatDuration(session.duration_s)}</span>
                  </div>
                  {session.calories && (
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-sm font-medium">{session.calories} cal</span>
                    </div>
                  )}
                </div>

                {session.type !== 'swim' && session.pace && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Pace: {formatPace(session.pace)}
                  </div>
                )}
                {session.type === 'swim' && session.laps && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {session.laps} laps
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
