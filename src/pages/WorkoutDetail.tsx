import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Target, 
  Weight, 
  RotateCcw, 
  Edit3,
  HelpCircle,
  Activity
} from "lucide-react";
import { useWorkoutPlan } from "@/hooks/useWorkoutPlan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface WorkoutSet {
  id: number;
  reps: number;
  weight: number;
  completed: boolean;
  actualReps?: number;
  actualWeight?: number;
}

const WorkoutDetail = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Static workout data
  const workoutData: Record<string, any> = {
    "1": {
      name: "Chest Press Machine",
      sets: 4,
      reps: 10,
      weight: "60-80 lbs",
      restTime: 90,
      image: "/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png",
      primaryMuscle: "Pectoralis Major (Sternal head – mid chest)",
      secondaryMuscles: "Anterior deltoids, triceps brachii"
    },
    "2": {
      name: "Pec Deck (Butterfly) Machine", 
      sets: 4,
      reps: 12,
      weight: "40-60 lbs",
      restTime: 90,
      image: "/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png",
      primaryMuscle: "Pectoralis Major (Sternal & Clavicular heads – inner & upper chest)",
      secondaryMuscles: "Anterior deltoids, biceps (stabilizers)"
    },
    "3": {
      name: "Incline Chest Press Machine",
      sets: 3,
      reps: 10, 
      weight: "50-70 lbs",
      restTime: 90
    },
    "4": {
      name: "Decline Chest Press Machine",
      sets: 3,
      reps: "8-10",
      weight: "70-90 lbs", 
      restTime: 90
    },
    "5": {
      name: "Cable Crossover Machine",
      sets: 4,
      reps: "12-15",
      weight: "15-25 lbs per side",
      restTime: 75
    },
    "6": {
      name: "Smith Machine (Flat Bench Press setup)",
      sets: 4,
      reps: "8-10", 
      weight: "65-95 lbs (bar + plates)",
      restTime: 120
    },
    "7": {
      name: "Seated Dip Machine (Chest-focused variant)",
      sets: 3,
      reps: 12,
      weight: "Body weight + assistance",
      restTime: 90
    },
    "8": {
      name: "Assisted Chest Dips Machine",
      sets: 3,
      reps: 12,
      weight: "Body weight + assistance", 
      restTime: 90
    }
  };

  const workout = workoutData[workoutId || "1"];

  useEffect(() => {
    if (workout) {
      initializeSets();
    }
  }, [workoutId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      timer = setTimeout(() => {
        setRestTime(restTime - 1);
      }, 1000);
    } else if (isResting && restTime === 0) {
      setIsResting(false);
      toast.success("Rest time complete! Ready for next set");
    }
    return () => clearTimeout(timer);
  }, [isResting, restTime]);

  const initializeSets = () => {
    if (!workout) return;
    
    const newSets: WorkoutSet[] = [];
    for (let i = 0; i < workout.sets; i++) {
      newSets.push({
        id: i + 1,
        reps: typeof workout.reps === 'string' ? parseInt(workout.reps.split('-')[0]) : workout.reps,
        weight: 0,
        completed: false,
        actualReps: typeof workout.reps === 'string' ? parseInt(workout.reps.split('-')[0]) : workout.reps,
        actualWeight: 0
      });
    }
    setSets(newSets);
  };

  const handleSetComplete = (setIndex: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex].completed = true;
    setSets(updatedSets);

    // Start rest timer
    setRestTime(workout.restTime);
    setIsResting(true);

    toast.success(`Set ${setIndex + 1} completed!`);
  };

  const handleSetEdit = (setIndex: number, field: 'actualReps' | 'actualWeight', value: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex][field] = value;
    setSets(updatedSets);
  };

  const completeWorkout = () => {
    toast.success('Workout completed!');
    navigate('/workout-summary', { 
      state: { 
        workoutData: {
          name: workout.name,
          sets: sets.filter(s => s.completed).length,
          totalSets: sets.length,
          notes: notes
        }
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !workout) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p>Loading workout...</p>
        </div>
      </div>
    );
  }

  const completedSets = sets.filter(s => s.completed).length;
  const totalSets = sets.length;
  const exerciseProgress = (completedSets / totalSets) * 100;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <p className="text-muted-foreground">
            Chest Workout • {workout.sets} sets × {workout.reps} reps
          </p>
        </div>
        <Badge variant="outline">
          Chest
        </Badge>
      </div>

      {/* Exercise Progress */}
      <Card className="glow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Exercise Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedSets} of {totalSets} sets completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(exerciseProgress)}%</div>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-3">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${exerciseProgress}%` }}
          />
        </div>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card className="glow-card p-6 text-center border-primary">
          <Clock className="h-8 w-8 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Rest Time</h3>
          <div className="text-3xl font-bold text-primary mb-4">
            {formatTime(restTime)}
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsResting(false);
              setRestTime(0);
            }}
          >
            Skip Rest
          </Button>
        </Card>
      )}

      {/* Machine Image and Muscle Groups */}
      {workout.image && (
        <Card className="glow-card p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <img 
                src={workout.image} 
                alt={workout.name}
                className="w-full h-64 object-contain rounded-lg bg-secondary/50"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">Primary Muscle</h4>
                <p className="text-sm">{workout.primaryMuscle}</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Secondary Muscles</h4>
                <p className="text-sm">{workout.secondaryMuscles}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Exercise Details */}
      <Card className="glow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Exercise Details</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.sets}</div>
            <div className="text-sm text-muted-foreground">Sets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.reps}</div>
            <div className="text-sm text-muted-foreground">Reps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatTime(workout.restTime)}</div>
            <div className="text-sm text-muted-foreground">Rest</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Chest</div>
            <div className="text-sm text-muted-foreground">Target</div>
          </div>
        </div>
        
        <div className="bg-background/50 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Starting Weight:</strong> {workout.weight}
          </p>
        </div>
      </Card>

      {/* Sets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sets</h3>
        {sets.map((set, index) => (
          <Card 
            key={set.id} 
            className={`glow-card p-4 ${set.completed ? 'border-green-500 bg-green-500/5' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold">Set {set.id}</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={set.actualReps}
                      onChange={(e) => handleSetEdit(index, 'actualReps', parseInt(e.target.value) || 0)}
                      className="w-16 h-8"
                      disabled={set.completed}
                    />
                    <span className="text-sm text-muted-foreground">reps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={set.actualWeight}
                      onChange={(e) => handleSetEdit(index, 'actualWeight', parseInt(e.target.value) || 0)}
                      className="w-20 h-8"
                      disabled={set.completed}
                    />
                    <span className="text-sm text-muted-foreground">lbs</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {set.completed ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Button
                    onClick={() => handleSetComplete(index)}
                    disabled={isResting}
                    className="h-8"
                  >
                    Complete Set
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <Card className="glow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Edit3 className="h-4 w-4" />
          <label className="text-sm font-medium">Exercise Notes</label>
        </div>
        <Textarea
          placeholder="How did this exercise feel? Any observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-20"
        />
      </Card>

      {/* Help */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <HelpCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Tips</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Proper Form</h4>
              <p className="text-sm text-muted-foreground">
                Focus on controlled movements and full range of motion. Quality over quantity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Weight Selection</h4>
              <p className="text-sm text-muted-foreground">
                Choose a weight that allows you to complete all reps with good form while feeling challenged on the last 2-3 reps.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rest Periods</h4>
              <p className="text-sm text-muted-foreground">
                Rest periods are optimized for your goals. For strength: 2-3 mins, for hypertrophy: 1-2 mins.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/workout-list')}
          className="h-12"
        >
          Back to List
        </Button>
        
        {completedSets === totalSets ? (
          <Button 
            onClick={completeWorkout}
            className="h-12"
            disabled={loading}
          >
            Complete Workout
          </Button>
        ) : (
          <Button 
            variant="outline"
            disabled
            className="h-12"
          >
            Complete all sets to continue
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkoutDetail;