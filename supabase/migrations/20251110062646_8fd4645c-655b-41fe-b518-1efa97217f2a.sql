-- Create saved_menu_items table for users to save favorite menu items
CREATE TABLE public.saved_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_name TEXT,
  item_name TEXT NOT NULL,
  calories INTEGER,
  price NUMERIC(10, 2),
  description TEXT,
  dietary_tags TEXT[],
  health_score INTEGER,
  macros JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_menu_items
CREATE POLICY "Users can view their own saved menu items"
  ON public.saved_menu_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved menu items"
  ON public.saved_menu_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved menu items"
  ON public.saved_menu_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved menu items"
  ON public.saved_menu_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_saved_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_menu_items_updated_at
  BEFORE UPDATE ON public.saved_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_menu_items_updated_at();

-- Create index for faster queries
CREATE INDEX idx_saved_menu_items_user_id ON public.saved_menu_items(user_id);
CREATE INDEX idx_saved_menu_items_created_at ON public.saved_menu_items(user_id, created_at DESC);