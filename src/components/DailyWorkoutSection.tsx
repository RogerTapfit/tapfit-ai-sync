import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Dumbbell } from "lucide-react";

interface WorkoutMachine {
  id: string;
  name: string;
  muscleGroup: string;
  completed: boolean;
  workoutDetails?: {
    sets: number;
    reps: number;
    weight?: number;
    completedAt?: string;
    totalWeightLifted?: number;
  };
}

interface DailyWorkoutSectionProps {
  title: string;
  workouts: WorkoutMachine[];
  onWorkoutClick: (workoutId: string) => void;
  onToggleComplete: (workoutId: string, e: React.MouseEvent) => void;
  showTime?: boolean;
}

export const DailyWorkoutSection: React.FC<DailyWorkoutSectionProps> = ({
  title,
  workouts,
  onWorkoutClick,
  onToggleComplete,
  showTime = false
}) => {
  if (workouts.length === 0) return null;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: Record<string, string> = {
      chest: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      back: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      legs: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      shoulders: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      arms: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      core: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      cardio: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      glutes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    };
    return colors[muscleGroup] || colors.other;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          {title}
        </h3>
        <Badge variant="outline" className="bg-primary/10">
          {workouts.filter(w => w.completed).length}/{workouts.length} Complete
        </Badge>
      </div>
      
      <div className="space-y-2">
        {workouts.map((workout) => (
          <Card 
            key={workout.id}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md bg-card/50 backdrop-blur-sm ${
              workout.completed 
                ? 'border-green-500/30 bg-green-950/20' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onWorkoutClick(workout.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={(e) => onToggleComplete(workout.id, e)}
                  className={`p-1 rounded-full transition-colors ${
                    workout.completed 
                      ? 'text-green-400 bg-green-950/40' 
                      : 'text-muted-foreground hover:text-green-400 hover:bg-green-950/40'
                  }`}
                >
                  <CheckCircle className="h-5 w-5" />
                </button>
                
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{workout.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getMuscleGroupColor(workout.muscleGroup)}`}
                    >
                      {workout.muscleGroup}
                    </Badge>
                    
                    {workout.workoutDetails && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{workout.workoutDetails.sets} sets × {workout.workoutDetails.reps} reps</span>
                        {workout.workoutDetails.weight && (
                          <span>@ {workout.workoutDetails.weight} lbs</span>
                        )}
                        {workout.workoutDetails.totalWeightLifted && (
                          <span className="text-primary font-medium">
                            {workout.workoutDetails.totalWeightLifted} lbs total
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {showTime && workout.workoutDetails?.completedAt && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(workout.workoutDetails.completedAt)}
                  </div>
                )}
                
                {workout.completed && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};