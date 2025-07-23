-- Create smart_pin_data table for real-time workout tracking
CREATE TABLE public.smart_pin_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  heart_rate INTEGER,
  duration FLOAT NOT NULL,
  muscle_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.smart_pin_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own smart pin data" 
ON public.smart_pin_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own smart pin data" 
ON public.smart_pin_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart pin data" 
ON public.smart_pin_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smart pin data" 
ON public.smart_pin_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_smart_pin_data_user_id ON public.smart_pin_data(user_id);
CREATE INDEX idx_smart_pin_data_timestamp ON public.smart_pin_data(timestamp DESC);
CREATE INDEX idx_smart_pin_data_machine_id ON public.smart_pin_data(machine_id);

-- Enable real-time updates
ALTER TABLE public.smart_pin_data REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_pin_data;