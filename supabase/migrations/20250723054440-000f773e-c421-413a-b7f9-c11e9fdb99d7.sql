-- Create machines table for gym equipment reference data
CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT,
  location TEXT, -- Can store gym location or gym_id when gyms table exists
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (users need to see machine data)
CREATE POLICY "Anyone can view machines" 
ON public.machines 
FOR SELECT 
USING (true);

-- Create policy for authenticated inserts (restrict to future admin/staff roles)
CREATE POLICY "Authenticated users can insert machines" 
ON public.machines 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated updates (restrict to future admin/staff roles)
CREATE POLICY "Authenticated users can update machines" 
ON public.machines 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated deletes (restrict to future admin/staff roles)
CREATE POLICY "Authenticated users can delete machines" 
ON public.machines 
FOR DELETE 
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_machines_type ON public.machines(type);
CREATE INDEX idx_machines_location ON public.machines(location);
CREATE INDEX idx_machines_name ON public.machines(name);

-- Insert some sample machine data
INSERT INTO public.machines (name, type, brand, location) VALUES
('Leg Press Station 1', 'Leg Press', 'Cybex', 'Lower Level - Zone A'),
('Bench Press 1', 'Bench Press', 'Hammer Strength', 'Main Floor - Free Weights'),
('Bench Press 2', 'Bench Press', 'Hammer Strength', 'Main Floor - Free Weights'),
('Lat Pulldown 1', 'Lat Pulldown', 'Life Fitness', 'Main Floor - Cable Zone'),
('Chest Press 1', 'Chest Press', 'Technogym', 'Main Floor - Machine Zone'),
('Shoulder Press 1', 'Shoulder Press', 'Technogym', 'Main Floor - Machine Zone'),
('Leg Extension 1', 'Leg Extension', 'Cybex', 'Lower Level - Zone A'),
('Leg Curl 1', 'Leg Curl', 'Cybex', 'Lower Level - Zone A'),
('Cable Crossover 1', 'Cable Crossover', 'Life Fitness', 'Main Floor - Cable Zone'),
('Smith Machine 1', 'Smith Machine', 'Hammer Strength', 'Main Floor - Free Weights');