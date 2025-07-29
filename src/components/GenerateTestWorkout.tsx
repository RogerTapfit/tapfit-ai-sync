import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { Brain, Calendar } from 'lucide-react';

const GenerateTestWorkout = () => {
  const { generateNewPlan, loading, currentPlan } = useWorkoutPlan();

  const handleGenerateTest = async () => {
    // Create sample preferences for testing
    const testPreferences = {
      current_fitness_level: 'intermediate' as const,
      primary_goal: 'muscle_building' as const,
      workout_frequency: 5,
      session_duration_preference: 60,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      preferred_time_slots: ['18:00'],
      equipment_restrictions: [],
      health_conditions: [],
      target_muscle_groups: ['chest', 'back', 'shoulders', 'legs', 'glutes', 'arms'],
      available_equipment: ['chest_press', 'shoulder_press', 'lat_pulldown', 'seated_row', 'leg_press', 'leg_extension', 'leg_curl'],
      preferred_workout_time: 'evening' as const
    };

    await generateNewPlan();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Quick Test Workout Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate a sample 5-day workout plan to test the weekly schedule functionality.
        </p>
        
        {currentPlan && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">
              ✅ Current Plan: {currentPlan.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Plan is active with {currentPlan.workouts?.length || 0} workouts scheduled
            </p>
          </div>
        )}

        <Button 
          onClick={handleGenerateTest} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              Generating Test Plan...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Generate Test 5-Day Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GenerateTestWorkout;