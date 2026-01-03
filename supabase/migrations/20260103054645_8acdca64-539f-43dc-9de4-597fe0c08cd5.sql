-- Create user_habits table for habit definitions
CREATE TABLE public.user_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✓',
  category TEXT NOT NULL DEFAULT 'general',
  goal_per_day INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit_completions table for logging completions
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  coins_awarded INTEGER NOT NULL DEFAULT 0
);

-- Create habit_streaks table for tracking streaks
CREATE TABLE public.habit_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_habits
CREATE POLICY "Users can view their own habits" ON public.user_habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" ON public.user_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON public.user_habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON public.user_habits
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for habit_completions
CREATE POLICY "Users can view their own completions" ON public.habit_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions" ON public.habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions" ON public.habit_completions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for habit_streaks
CREATE POLICY "Users can view their own streaks" ON public.habit_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own streaks" ON public.habit_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_habits_user_id ON public.user_habits(user_id);
CREATE INDEX idx_habit_completions_user_date ON public.habit_completions(user_id, completed_date);
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX idx_habit_streaks_user_habit ON public.habit_streaks(user_id, habit_id);

-- Create trigger for updated_at on user_habits
CREATE TRIGGER update_user_habits_updated_at
  BEFORE UPDATE ON public.user_habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on habit_streaks
CREATE TRIGGER update_habit_streaks_updated_at
  BEFORE UPDATE ON public.habit_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();