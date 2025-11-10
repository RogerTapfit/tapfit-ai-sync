-- Create table for shared menu items
CREATE TABLE IF NOT EXISTS public.shared_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  share_token TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  item_data JSONB NOT NULL,
  restaurant_name TEXT,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for shared comparisons
CREATE TABLE IF NOT EXISTS public.shared_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  share_token TEXT NOT NULL UNIQUE,
  comparison_data JSONB NOT NULL,
  restaurant_name TEXT,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_menu_items_token ON public.shared_menu_items(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_menu_items_user ON public.shared_menu_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_comparisons_token ON public.shared_comparisons(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_comparisons_user ON public.shared_comparisons(user_id);

-- Enable RLS
ALTER TABLE public.shared_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_menu_items
-- Anyone can view shared items (public access)
CREATE POLICY "Anyone can view shared menu items"
  ON public.shared_menu_items
  FOR SELECT
  USING (true);

-- Users can create their own shares
CREATE POLICY "Users can create their own shared menu items"
  ON public.shared_menu_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shared menu items"
  ON public.shared_menu_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own shares (for view count)
CREATE POLICY "Users can update their own shared menu items"
  ON public.shared_menu_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can update view counts
CREATE POLICY "System can update shared menu item view counts"
  ON public.shared_menu_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for shared_comparisons
-- Anyone can view shared comparisons (public access)
CREATE POLICY "Anyone can view shared comparisons"
  ON public.shared_comparisons
  FOR SELECT
  USING (true);

-- Users can create their own shares
CREATE POLICY "Users can create their own shared comparisons"
  ON public.shared_comparisons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shared comparisons"
  ON public.shared_comparisons
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own shares
CREATE POLICY "Users can update their own shared comparisons"
  ON public.shared_comparisons
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can update view counts
CREATE POLICY "System can update shared comparison view counts"
  ON public.shared_comparisons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.shared_menu_items
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  DELETE FROM public.shared_comparisons
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_shared_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_shared_menu_items_updated_at
  BEFORE UPDATE ON public.shared_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shared_items_updated_at();

CREATE TRIGGER update_shared_comparisons_updated_at
  BEFORE UPDATE ON public.shared_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shared_items_updated_at();