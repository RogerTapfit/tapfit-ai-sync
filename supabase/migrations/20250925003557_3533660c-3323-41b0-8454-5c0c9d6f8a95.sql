-- Create alcohol_entries table for tracking alcohol consumption
CREATE TABLE public.alcohol_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  drink_type TEXT NOT NULL,
  alcohol_content NUMERIC DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.alcohol_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alcohol entries
CREATE POLICY "Users can view their own alcohol entries" 
ON public.alcohol_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alcohol entries" 
ON public.alcohol_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alcohol entries" 
ON public.alcohol_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alcohol entries" 
ON public.alcohol_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_alcohol_entries_updated_at
BEFORE UPDATE ON public.alcohol_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();