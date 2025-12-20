import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Dumbbell,
  Award,
  ArrowLeft,
  Flame,
  Target,
  Crown,
  BarChart3,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { WeightProgressionChart } from '@/components/WeightProgressionChart';
import { formatCoinsForDisplay } from '@/lib/coinUtils';

interface PersonalRecord {
  id: string;
  machineName: string;
  exerciseName: string;
  weightLbs: number;
  reps: number;
  sets: number;
  achievedAt: string;
  improvementPercentage?: number;
  previousRecordWeight?: number;
}

interface PRHistoryRecord {
  id: string;
  machineName: string;
  weightLbs: number;
  achievedAt: string;
  coinsAwarded: number;
}

export default function PRLeaderboard() {
  const navigate = useNavigate();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [prHistory, setPRHistory] = useState<PRHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'biggest'>('all');
  const [selectedExercise, setSelectedExercise] = useState<{ exerciseName: string; machineName: string } | null>(null);

  useEffect(() => {
    fetchPersonalRecords();
    fetchPRHistory();
  }, []);

  const fetchPersonalRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (error) throw error;

      setPersonalRecords(
        data?.map(record => ({
          id: record.id,
          machineName: record.machine_name,
          exerciseName: record.exercise_name,
          weightLbs: record.weight_lbs,
          reps: record.reps,
          sets: record.sets,
          achievedAt: record.achieved_at,
          improvementPercentage: record.improvement_percentage,
          previousRecordWeight: record.previous_record_weight
        })) || []
      );
    } catch (err) {
      console.error('Error fetching personal records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPRHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pr_history')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setPRHistory(
        data?.map(record => ({
          id: record.id,
          machineName: record.machine_name,
          weightLbs: record.weight_lbs,
          achievedAt: record.achieved_at,
          coinsAwarded: record.coins_awarded
        })) || []
      );
    } catch (err) {
      console.error('Error fetching PR history:', err);
    }
  };

  const getFilteredRecords = () => {
    let filtered = [...personalRecords];
    
    switch (filter) {
      case 'recent':
        return filtered.slice(0, 10);
      case 'biggest':
        return filtered.sort((a, b) => 
          (b.improvementPercentage || 0) - (a.improvementPercentage || 0)
        ).slice(0, 10);
      default:
        return filtered.sort((a, b) => b.weightLbs - a.weightLbs);
    }
  };

  const getTotalPRs = () => personalRecords.length;
  
  const getTotalCoinsEarned = () => 
    prHistory.reduce((sum, record) => sum + record.coinsAwarded, 0);
  
  const getBiggestImprovement = () => {
    const biggest = personalRecords.reduce((max, record) => 
      (record.improvementPercentage || 0) > (max.improvementPercentage || 0) ? record : max
    , personalRecords[0]);
    return biggest;
  };

  const getHeaviestLift = () => {
    return personalRecords.reduce((max, record) => 
      record.weightLbs > max.weightLbs ? record : max
    , personalRecords[0] || { weightLbs: 0, machineName: 'N/A' });
  };

  const filteredRecords = getFilteredRecords();
  const biggestImprovement = getBiggestImprovement();
  const heaviestLift = getHeaviestLift();

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your personal records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Personal Records
          </h1>
          <p className="text-muted-foreground">Your strength achievements and progress</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total PRs</p>
                <p className="text-2xl font-bold">{getTotalPRs()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Heaviest Lift</p>
                <p className="text-2xl font-bold">{heaviestLift.weightLbs} lbs</p>
                <p className="text-xs text-muted-foreground truncate">{heaviestLift.machineName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Improvement</p>
                <p className="text-2xl font-bold">+{biggestImprovement?.improvementPercentage || 0}%</p>
                <p className="text-xs text-muted-foreground truncate">{biggestImprovement?.machineName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coins Earned</p>
                <p className="text-2xl font-bold">{getTotalCoinsEarned()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current PRs</TabsTrigger>
          <TabsTrigger value="history">PR History</TabsTrigger>
          <TabsTrigger value="charts">Progress Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Records
            </Button>
            <Button
              variant={filter === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('recent')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Recent
            </Button>
            <Button
              variant={filter === 'biggest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('biggest')}
            >
              <Flame className="h-4 w-4 mr-2" />
              Biggest Gains
            </Button>
          </div>

          {/* PR Cards */}
          {filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Personal Records Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start working out to set your first PR!
                </p>
                <Button onClick={() => navigate('/workout-list')}>
                  Browse Workouts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((record, index) => (
                <Card key={record.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                          {index === 0 && filter === 'all' && (
                            <div className="p-2 bg-yellow-500/10 rounded-full">
                              <Crown className="h-6 w-6 text-yellow-500" />
                            </div>
                          )}
                          {index !== 0 && (
                            <div className="w-10 h-10 flex items-center justify-center bg-secondary rounded-full">
                              <span className="text-sm font-bold">#{index + 1}</span>
                            </div>
                          )}
                        </div>

                        {/* Machine Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {record.machineName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {record.sets} sets × {record.reps} reps
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.achievedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>

                        {/* Weight Display */}
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {record.weightLbs}
                          </div>
                          <div className="text-sm text-muted-foreground">lbs</div>
                        </div>

                        {/* Improvement Badge */}
                        {record.improvementPercentage && record.improvementPercentage > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +{record.improvementPercentage}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Previous Record */}
                    {record.previousRecordWeight && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Previous: {record.previousRecordWeight} lbs 
                        <span className="mx-2">→</span>
                        Increased by {record.weightLbs - record.previousRecordWeight} lbs
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {prHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No PR History</h3>
                <p className="text-muted-foreground">
                  Your PR achievements will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {prHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-yellow-500/10 rounded-full">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{record.machineName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.achievedAt), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{record.weightLbs} lbs</div>
                          <Badge variant="secondary" className="mt-1">
                            +{formatCoinsForDisplay(record.coinsAwarded)} coins
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {selectedExercise ? (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedExercise(null)}
              >
                ← Back to Exercise List
              </Button>
              <WeightProgressionChart
                exerciseName={selectedExercise.exerciseName}
                machineName={selectedExercise.machineName}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select an Exercise</CardTitle>
                <CardDescription>Choose an exercise to view detailed progression charts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {filteredRecords.map((record) => (
                    <Button
                      key={record.id}
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => setSelectedExercise({ 
                        exerciseName: record.exerciseName, 
                        machineName: record.machineName 
                      })}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <div className="font-semibold">{record.exerciseName}</div>
                          <div className="text-sm text-muted-foreground">{record.machineName}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <div className="font-bold">{record.weightLbs} lbs</div>
                            <div className="text-xs text-muted-foreground">{record.reps}×{record.sets}</div>
                          </div>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
