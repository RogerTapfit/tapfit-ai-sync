import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FitnessPreferences {
  current_fitness_level: 'beginner' | 'intermediate' | 'advanced';
  primary_goal: 'muscle_building' | 'fat_loss' | 'toning' | 'endurance' | 'general_fitness';
  workout_frequency: number;
  session_duration_preference: number;
  available_days: string[];
  preferred_time_slots: string[];
  equipment_restrictions?: string[];
  health_conditions?: string[];
  target_muscle_groups?: string[];
  available_equipment?: string[];
  preferred_workout_time?: 'morning' | 'afternoon' | 'evening';
}

export interface WorkoutExercise {
  machine: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  weight_guidance?: string;
  order: number;
}

export interface ScheduledWorkout {
  id?: string;
  day: string;
  time: string;
  muscle_group: string;
  duration: number;
  exercises: WorkoutExercise[];
  scheduled_date?: string;
  status?: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
}

export interface WorkoutPlan {
  id?: string;
  name: string;
  workouts: ScheduledWorkout[];
  notes?: string;
  fitness_goal: string;
}

export const useWorkoutPlan = () => {
  const [preferences, setPreferences] = useState<FitnessPreferences | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user preferences and current plan
  useEffect(() => {
    loadUserPreferences();
    loadCurrentPlan();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_fitness_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data as FitnessPreferences);
      } else {
        // Create default preferences
        const defaultPrefs: FitnessPreferences = {
          current_fitness_level: 'beginner',
          primary_goal: 'general_fitness',
          workout_frequency: 5,
          session_duration_preference: 60,
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          preferred_time_slots: ['18:00'],
          equipment_restrictions: [],
          health_conditions: [],
          target_muscle_groups: ['chest', 'back', 'shoulders', 'legs'],
          available_equipment: [],
          preferred_workout_time: 'evening'
        };
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error loading plan:', planError);
        return;
      }

      if (planData) {
        // Load scheduled workouts for this week
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

        const { data: workoutsData, error: workoutsError } = await supabase
          .from('scheduled_workouts')
          .select(`
            *,
            workout_exercises (*)
          `)
          .eq('workout_plan_id', planData.id)
          .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
          .lte('scheduled_date', endOfWeek.toISOString().split('T')[0]);

        if (workoutsError) {
          console.error('Error loading workouts:', workoutsError);
          return;
        }

        // Transform the data to match our interfaces
        const transformedWorkouts = (workoutsData || []).map((workout: any) => ({
          id: workout.id,
          day: new Date(workout.scheduled_date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          time: workout.scheduled_time,
          muscle_group: workout.target_muscle_group,
          duration: workout.estimated_duration,
          exercises: workout.workout_exercises?.map((ex: any) => ({
            machine: ex.machine_name,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            weight_guidance: ex.notes,
            order: ex.exercise_order
          })) || [],
          scheduled_date: workout.scheduled_date,
          status: workout.status
        }));

        setCurrentPlan({
          id: planData.id,
          name: planData.name,
          workouts: transformedWorkouts,
          fitness_goal: planData.fitness_goal,
          notes: planData.injuries_notes
        });
        setWeeklySchedule(transformedWorkouts);
      }
    } catch (error) {
      console.error('Error loading current plan:', error);
    }
  };

  const savePreferences = async (newPrefs: FitnessPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_fitness_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs
        });

      if (error) throw error;

      setPreferences(newPrefs);
      toast.success('Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const generateNewPlan = async () => {
    if (!preferences) {
      toast.error('Please set your preferences first');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Call the edge function to generate plan
      const { data, error } = await supabase.functions.invoke('generateWorkoutPlan', {
        body: { preferences }
      });

      if (error) throw error;

      // Save the generated plan to database
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: data.plan_name,
          fitness_goal: preferences.primary_goal,
          preferred_days: preferences.available_days,
          preferred_times: preferences.preferred_time_slots,
          max_workout_duration: preferences.session_duration_preference
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create scheduled workouts
      const scheduledWorkouts = data.workouts.map((workout: any) => {
        const today = new Date();
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(workout.day);
        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);

        return {
          workout_plan_id: planData.id,
          user_id: user.id,
          scheduled_date: workoutDate.toISOString().split('T')[0],
          scheduled_time: workout.time,
          target_muscle_group: workout.muscle_group,
          estimated_duration: workout.duration
        };
      });

      const { data: workoutData, error: workoutError } = await supabase
        .from('scheduled_workouts')
        .insert(scheduledWorkouts)
        .select();

      if (workoutError) throw workoutError;

      // Create exercises for each workout
      for (let i = 0; i < data.workouts.length; i++) {
        const workout = data.workouts[i];
        const scheduledWorkout = workoutData[i];

        const exercises = workout.exercises.map((exercise: any) => ({
          scheduled_workout_id: scheduledWorkout.id,
          machine_name: exercise.machine,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          exercise_order: exercise.order,
          notes: exercise.weight_guidance
        }));

        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(exercises);

        if (exerciseError) throw exerciseError;
      }

      // Deactivate old plans
      await supabase
        .from('workout_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', planData.id);

      toast.success('New workout plan generated!');
      await loadCurrentPlan();

    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error('Failed to generate workout plan');
    } finally {
      setLoading(false);
    }
  };

  const markWorkoutComplete = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', workoutId);

      if (error) throw error;

      toast.success('Workout completed! 🎉');
      await loadCurrentPlan();
    } catch (error) {
      console.error('Error marking workout complete:', error);
      toast.error('Failed to update workout status');
    }
  };

  const rescheduleWorkout = async (workoutId: string, newDate: string, newTime: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          status: 'rescheduled'
        })
        .eq('id', workoutId);

      if (error) throw error;

      toast.success('Workout rescheduled!');
      await loadCurrentPlan();
    } catch (error) {
      console.error('Error rescheduling workout:', error);
      toast.error('Failed to reschedule workout');
    }
  };

  return {
    preferences,
    currentPlan,
    weeklySchedule,
    loading,
    savePreferences,
    generateNewPlan,
    markWorkoutComplete,
    rescheduleWorkout,
    refreshPlan: loadCurrentPlan
  };
};