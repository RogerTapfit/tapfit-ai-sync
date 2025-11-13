-- Create fitness_alarms table
CREATE TABLE public.fitness_alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alarm_time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  push_up_count INTEGER NOT NULL DEFAULT 15,
  alarm_sound TEXT NOT NULL DEFAULT 'classic',
  days_of_week JSONB NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alarm_completions table
CREATE TABLE public.alarm_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarm_id UUID NOT NULL REFERENCES public.fitness_alarms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  push_ups_completed INTEGER NOT NULL,
  time_to_complete INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fitness_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarm_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fitness_alarms
CREATE POLICY "Users can view their own alarms"
  ON public.fitness_alarms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alarms"
  ON public.fitness_alarms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alarms"
  ON public.fitness_alarms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alarms"
  ON public.fitness_alarms FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for alarm_completions
CREATE POLICY "Users can view their own alarm completions"
  ON public.alarm_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alarm completions"
  ON public.alarm_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_fitness_alarms_user_id ON public.fitness_alarms(user_id);
CREATE INDEX idx_fitness_alarms_enabled ON public.fitness_alarms(enabled);
CREATE INDEX idx_alarm_completions_user_id ON public.alarm_completions(user_id);
CREATE INDEX idx_alarm_completions_alarm_id ON public.alarm_completions(alarm_id);

-- Trigger to update updated_at
CREATE TRIGGER update_fitness_alarms_updated_at
  BEFORE UPDATE ON public.fitness_alarms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();