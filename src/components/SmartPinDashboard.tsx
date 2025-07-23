import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Heart, Timer, Target, Dumbbell, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartPinDataEntry {
  id: string;
  machine_id: string;
  timestamp: string;
  reps: number;
  sets: number;
  weight: number;
  heart_rate: number | null;
  duration: number;
  muscle_group: string;
}

const SmartPinDashboard = () => {
  const [smartPinData, setSmartPinData] = useState<SmartPinDataEntry[]>([]);
  const [realtimeData, setRealtimeData] = useState<SmartPinDataEntry | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    const fetchSmartPinData = async () => {
      try {
        const { data, error } = await supabase
          .from('smart_pin_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (error) throw error;
        setSmartPinData(data || []);
      } catch (error) {
        console.error('Error fetching smart pin data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch smart pin data",
          variant: "destructive",
        });
      }
    };

    fetchSmartPinData();
  }, [toast]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('smart-pin-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smart_pin_data'
        },
        (payload) => {
          console.log('New smart pin data received:', payload);
          const newData = payload.new as SmartPinDataEntry;
          setRealtimeData(newData);
          setSmartPinData(prev => [newData, ...prev.slice(0, 9)]);
          setIsConnected(true);
          
          toast({
            title: "Smart Pin Data Received",
            description: `New workout data from ${newData.machine_id}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Simulate connection status
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const addTestData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add test data",
          variant: "destructive",
        });
        return;
      }

      const testData = {
        user_id: user.id,
        machine_id: `MACHINE_${Math.floor(Math.random() * 10) + 1}`,
        reps: Math.floor(Math.random() * 15) + 5,
        sets: Math.floor(Math.random() * 4) + 1,
        weight: Math.floor(Math.random() * 100) + 50,
        heart_rate: Math.floor(Math.random() * 50) + 120,
        duration: Math.random() * 300 + 60,
        muscle_group: ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders'][Math.floor(Math.random() * 5)]
      };

      const { error } = await supabase
        .from('smart_pin_data')
        .insert([testData]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding test data:', error);
      toast({
        title: "Error",
        description: "Failed to add test data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Smart Pin Dashboard</h1>
          <p className="text-muted-foreground">Real-time workout data from smart pins</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <Button onClick={addTestData} variant="outline" size="sm">
            Add Test Data
          </Button>
        </div>
      </div>

      {/* Live Data Stream */}
      {realtimeData && (
        <Card className="glow-card border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle className="text-lg">Live Data Stream</CardTitle>
            </div>
            <CardDescription>Most recent smart pin data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{realtimeData.weight}lbs</div>
                <div className="text-xs text-muted-foreground">Weight</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{realtimeData.reps}</div>
                <div className="text-xs text-muted-foreground">Reps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{realtimeData.sets}</div>
                <div className="text-xs text-muted-foreground">Sets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {realtimeData.heart_rate || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">BPM</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant="secondary">{realtimeData.machine_id}</Badge>
              <Badge className="bg-primary text-primary-foreground">
                {realtimeData.muscle_group}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDuration(realtimeData.duration)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {smartPinData.map((entry, index) => (
          <Card key={entry.id} className={`glow-card ${index === 0 ? 'ring-2 ring-primary/20' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{entry.machine_id}</CardTitle>
                <Badge variant="outline">{entry.muscle_group}</Badge>
              </div>
              <CardDescription>
                {new Date(entry.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{entry.weight}lbs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{entry.reps} reps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{entry.sets} sets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(entry.duration)}</span>
                </div>
              </div>
              {entry.heart_rate && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{entry.heart_rate} BPM</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {smartPinData.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Smart Pin Data</h3>
          <p className="text-muted-foreground mb-4">
            Start your workout with a smart pin to see real-time data here
          </p>
          <Button onClick={addTestData} variant="glow">
            Add Test Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartPinDashboard;