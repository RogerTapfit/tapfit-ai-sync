-- Enable real-time updates for food_entries table
ALTER TABLE public.food_entries REPLICA IDENTITY FULL;

-- Add food_entries to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_entries;