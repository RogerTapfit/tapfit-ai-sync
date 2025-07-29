-- Add health_grade column to food_entries table
ALTER TABLE public.food_entries 
ADD COLUMN health_grade TEXT;

-- Add grade_score column to store the numerical score used for grading
ALTER TABLE public.food_entries 
ADD COLUMN grade_score INTEGER DEFAULT 0;