-- Create nutrition goals table
CREATE TABLE public.nutrition_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  goal_type TEXT NOT NULL CHECK (goal_type IN ('fat_loss', 'muscle_gain', 'maintenance')),
  daily_calories INTEGER NOT NULL,
  protein_grams INTEGER NOT NULL,
  carbs_grams INTEGER NOT NULL,
  fat_grams INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metabolism readings table
CREATE TABLE public.metabolism_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reading_type TEXT NOT NULL CHECK (reading_type IN ('fat_burn', 'carb_burn', 'mixed')),
  reading_value DECIMAL(5,2), -- Optional numeric value
  device_source TEXT DEFAULT 'lumen',
  recommendations TEXT[], -- Array of recommendation strings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food entries table
CREATE TABLE public.food_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_items JSONB NOT NULL, -- Array of food items with details
  total_calories INTEGER NOT NULL,
  total_protein DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(8,2) NOT NULL DEFAULT 0,
  photo_url TEXT,
  ai_analyzed BOOLEAN NOT NULL DEFAULT false,
  user_confirmed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily nutrition summary table
CREATE TABLE public.daily_nutrition_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  summary_date DATE NOT NULL,
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(8,2) NOT NULL DEFAULT 0,
  meals_count INTEGER NOT NULL DEFAULT 0,
  metabolism_readings_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

-- Enable Row Level Security
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metabolism_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for nutrition_goals
CREATE POLICY "Users can view their own nutrition goals" 
ON public.nutrition_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nutrition goals" 
ON public.nutrition_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals" 
ON public.nutrition_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition goals" 
ON public.nutrition_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for metabolism_readings
CREATE POLICY "Users can view their own metabolism readings" 
ON public.metabolism_readings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metabolism readings" 
ON public.metabolism_readings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metabolism readings" 
ON public.metabolism_readings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for food_entries
CREATE POLICY "Users can view their own food entries" 
ON public.food_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food entries" 
ON public.food_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries" 
ON public.food_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries" 
ON public.food_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for daily_nutrition_summary
CREATE POLICY "Users can view their own nutrition summary" 
ON public.daily_nutrition_summary 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nutrition summary" 
ON public.daily_nutrition_summary 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition summary" 
ON public.daily_nutrition_summary 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_nutrition_goals_user_id ON public.nutrition_goals(user_id);
CREATE INDEX idx_nutrition_goals_active ON public.nutrition_goals(user_id, is_active);
CREATE INDEX idx_metabolism_readings_user_date ON public.metabolism_readings(user_id, created_at);
CREATE INDEX idx_food_entries_user_date ON public.food_entries(user_id, logged_date);
CREATE INDEX idx_daily_nutrition_user_date ON public.daily_nutrition_summary(user_id, summary_date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_nutrition_goals_updated_at
BEFORE UPDATE ON public.nutrition_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_entries_updated_at
BEFORE UPDATE ON public.food_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_nutrition_summary_updated_at
BEFORE UPDATE ON public.daily_nutrition_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update daily nutrition summary
CREATE OR REPLACE FUNCTION public.update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert daily summary
  INSERT INTO public.daily_nutrition_summary (
    user_id, 
    summary_date, 
    total_calories, 
    total_protein, 
    total_carbs, 
    total_fat, 
    meals_count
  )
  SELECT 
    user_id,
    logged_date,
    COALESCE(SUM(total_calories), 0),
    COALESCE(SUM(total_protein), 0),
    COALESCE(SUM(total_carbs), 0),
    COALESCE(SUM(total_fat), 0),
    COUNT(*)
  FROM public.food_entries
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND logged_date = COALESCE(NEW.logged_date, OLD.logged_date)
  GROUP BY user_id, logged_date
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    meals_count = EXCLUDED.meals_count,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers to update daily summary
CREATE TRIGGER trigger_update_daily_nutrition_summary_insert
AFTER INSERT ON public.food_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_nutrition_summary();

CREATE TRIGGER trigger_update_daily_nutrition_summary_update
AFTER UPDATE ON public.food_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_nutrition_summary();

CREATE TRIGGER trigger_update_daily_nutrition_summary_delete
AFTER DELETE ON public.food_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_nutrition_summary();