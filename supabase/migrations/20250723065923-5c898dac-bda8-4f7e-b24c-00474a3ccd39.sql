-- Create workout plans table
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fitness_goal TEXT NOT NULL CHECK (fitness_goal IN ('build_muscle', 'burn_fat', 'tone', 'increase_endurance')),
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  max_workout_duration INTEGER, -- in minutes
  preferred_days TEXT[], -- array of days like ['monday', 'wednesday', 'friday']
  preferred_times TEXT[], -- array of times like ['18:00', '19:00']
  machines_to_avoid TEXT[],
  injuries_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled workouts table
CREATE TABLE public.scheduled_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  target_muscle_group TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'rescheduled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout exercises table
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_workout_id UUID NOT NULL REFERENCES public.scheduled_workouts(id) ON DELETE CASCADE,
  machine_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight INTEGER, -- in lbs/kg
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  exercise_order INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user fitness preferences table
CREATE TABLE public.user_fitness_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_fitness_level TEXT NOT NULL DEFAULT 'beginner' CHECK (current_fitness_level IN ('beginner', 'intermediate', 'advanced')),
  primary_goal TEXT NOT NULL DEFAULT 'general_fitness' CHECK (primary_goal IN ('build_muscle', 'burn_fat', 'tone', 'increase_endurance', 'general_fitness')),
  workout_frequency INTEGER NOT NULL DEFAULT 3, -- times per week
  session_duration_preference INTEGER NOT NULL DEFAULT 45, -- minutes
  available_days TEXT[] NOT NULL DEFAULT ARRAY['monday', 'wednesday', 'friday'],
  preferred_time_slots TEXT[] NOT NULL DEFAULT ARRAY['18:00'],
  equipment_restrictions TEXT[],
  health_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fitness_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_plans
CREATE POLICY "Users can view their own workout plans" 
ON public.workout_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans" 
ON public.workout_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans" 
ON public.workout_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans" 
ON public.workout_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for scheduled_workouts
CREATE POLICY "Users can view their own scheduled workouts" 
ON public.scheduled_workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled workouts" 
ON public.scheduled_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled workouts" 
ON public.scheduled_workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled workouts" 
ON public.scheduled_workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view their own workout exercises" 
ON public.workout_exercises 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.scheduled_workouts WHERE id = scheduled_workout_id));

CREATE POLICY "Users can create their own workout exercises" 
ON public.workout_exercises 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.scheduled_workouts WHERE id = scheduled_workout_id));

CREATE POLICY "Users can update their own workout exercises" 
ON public.workout_exercises 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.scheduled_workouts WHERE id = scheduled_workout_id));

CREATE POLICY "Users can delete their own workout exercises" 
ON public.workout_exercises 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM public.scheduled_workouts WHERE id = scheduled_workout_id));

-- RLS Policies for user_fitness_preferences
CREATE POLICY "Users can view their own fitness preferences" 
ON public.user_fitness_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fitness preferences" 
ON public.user_fitness_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness preferences" 
ON public.user_fitness_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX idx_scheduled_workouts_user_id ON public.scheduled_workouts(user_id);
CREATE INDEX idx_scheduled_workouts_date ON public.scheduled_workouts(scheduled_date);
CREATE INDEX idx_workout_exercises_scheduled_workout_id ON public.workout_exercises(scheduled_workout_id);
CREATE INDEX idx_user_fitness_preferences_user_id ON public.user_fitness_preferences(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workout_plans_updated_at
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_fitness_preferences_updated_at
    BEFORE UPDATE ON public.user_fitness_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();