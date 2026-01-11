import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Minus, Play, Trash2, ChevronDown, ChevronUp, Clock, Dumbbell } from 'lucide-react';
import { atHomeExercises, exerciseCategories, AtHomeExercise, getExercisesByCategory } from '@/data/atHomeExercises';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExerciseFormImage } from '@/components/workout/ExerciseFormImage';
import { ExercisePreviewModal } from '@/components/workout/ExercisePreviewModal';

interface SelectedExercise extends AtHomeExercise {
  sets: number;
  reps: number;
  holdSeconds?: number;
}

export const AtHomeWorkoutBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['lower-body']);
  const [workoutName, setWorkoutName] = useState('My Home Workout');
  const [previewExercise, setPreviewExercise] = useState<AtHomeExercise | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addExercise = (exercise: AtHomeExercise) => {
    if (selectedExercises.find(e => e.id === exercise.id)) {
      toast.info(`${exercise.name} already added`);
      return;
    }
    setSelectedExercises(prev => [...prev, {
      ...exercise,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      holdSeconds: exercise.defaultHoldSeconds,
    }]);
    toast.success(`Added ${exercise.name}`);
  };

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  const updateExercise = (exerciseId: string, field: 'sets' | 'reps' | 'holdSeconds', delta: number) => {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const newValue = Math.max(1, (ex[field] || 0) + delta);
      return { ...ex, [field]: newValue };
    }));
  };

  const startWorkout = () => {
    if (selectedExercises.length === 0) {
      toast.error('Add at least one exercise to start');
      return;
    }
    // Store workout in session and navigate to execution
    sessionStorage.setItem('atHomeWorkout', JSON.stringify({
      name: workoutName,
      exercises: selectedExercises,
    }));
    navigate('/at-home-workout-session');
  };

  const estimatedDuration = selectedExercises.reduce((total, ex) => {
    const exerciseTime = ex.isHold 
      ? (ex.sets * (ex.holdSeconds || 30)) 
      : (ex.sets * ex.reps * 3); // ~3 seconds per rep
    return total + exerciseTime + (ex.sets * 30); // Add rest time
  }, 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/workout-mode-select')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="text-xl font-bold bg-transparent border-none px-0 focus-visible:ring-0"
                placeholder="Workout Name"
              />
              <p className="text-sm text-muted-foreground">
                {selectedExercises.length} exercises • ~{formatDuration(estimatedDuration)}
              </p>
            </div>
          </div>

          {/* Start Workout Button */}
          {selectedExercises.length > 0 && (
            <Button 
              onClick={startWorkout}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Workout ({selectedExercises.length} exercises)
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-32">
        {/* Selected Exercises */}
        {selectedExercises.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Your Workout
            </h3>
            <div className="space-y-3">
              {selectedExercises.map((ex, index) => (
                <div key={ex.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-lg font-medium w-6">{index + 1}</span>
                  <ExerciseFormImage 
                    exerciseId={ex.id} 
                    exerciseName={ex.name} 
                    emoji={ex.emoji}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{ex.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {/* Sets */}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateExercise(ex.id, 'sets', -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-16 text-center">{ex.sets} sets</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateExercise(ex.id, 'sets', 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Reps or Hold */}
                      {ex.isHold ? (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateExercise(ex.id, 'holdSeconds', -5)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-16 text-center">{ex.holdSeconds}s</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateExercise(ex.id, 'holdSeconds', 5)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateExercise(ex.id, 'reps', -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-16 text-center">{ex.reps} reps</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateExercise(ex.id, 'reps', 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeExercise(ex.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Exercise Library */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Exercise Library</h3>
          
          {exerciseCategories.map(category => {
            const exercises = getExercisesByCategory(category.id);
            const isExpanded = expandedCategories.includes(category.id);
            const addedCount = selectedExercises.filter(e => e.category === category.id).length;
            
            return (
              <Collapsible 
                key={category.id}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.emoji}</span>
                        <div className="text-left">
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{exercises.length} exercises</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {addedCount > 0 && (
                          <Badge variant="secondary">{addedCount} added</Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-border p-3 space-y-2">
                      {exercises.map(exercise => {
                        const isAdded = selectedExercises.some(e => e.id === exercise.id);
                        return (
                          <div
                            key={exercise.id}
                            className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                              isAdded 
                                ? 'bg-primary/10 opacity-60' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            {/* Clickable area for preview - image and name */}
                            <button
                              onClick={() => setPreviewExercise(exercise)}
                              className="flex items-center gap-3 flex-1 text-left"
                            >
                              <ExerciseFormImage 
                                exerciseId={exercise.id} 
                                exerciseName={exercise.name} 
                                emoji={exercise.emoji}
                                size="sm"
                                showModal={false}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{exercise.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.defaultSets} sets × {exercise.isHold ? `${exercise.defaultHoldSeconds}s hold` : `${exercise.defaultReps} reps`}
                                  <span className="ml-2">
                                    <Badge variant="outline" className="text-xs">
                                      {exercise.difficulty}
                                    </Badge>
                                  </span>
                                </p>
                              </div>
                            </button>
                            
                            {/* Add button - separate clickable area */}
                            {isAdded ? (
                              <Badge className="bg-primary/20 text-primary">Added</Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addExercise(exercise);
                                }}
                                className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Plus className="h-6 w-6" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Exercise Preview Modal */}
      <ExercisePreviewModal
        exercise={previewExercise}
        open={!!previewExercise}
        onClose={() => setPreviewExercise(null)}
        onAdd={addExercise}
        isAdded={previewExercise ? selectedExercises.some(e => e.id === previewExercise.id) : false}
      />
    </div>
  );
};

export default AtHomeWorkoutBuilder;
