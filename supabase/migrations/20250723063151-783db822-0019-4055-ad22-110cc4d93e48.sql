-- Add tap_coins_balance to profiles table
ALTER TABLE public.profiles ADD COLUMN tap_coins_balance INTEGER NOT NULL DEFAULT 0;

-- Create tap_coins_transactions table for transaction history
CREATE TABLE public.tap_coins_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for earning, negative for spending
  transaction_type TEXT NOT NULL, -- 'earn_workout', 'earn_milestone', 'spend_item', 'spend_bet', etc.
  description TEXT NOT NULL,
  reference_id UUID, -- optional reference to workout, item, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tap_coins_transactions
ALTER TABLE public.tap_coins_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for tap_coins_transactions
CREATE POLICY "Users can view their own transactions"
ON public.tap_coins_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.tap_coins_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create store_items table for rewards store
CREATE TABLE public.store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coin_cost INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'ability', 'cosmetic', 'entry', 'digital'
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_items
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Create policies for store_items
CREATE POLICY "Everyone can view active store items"
ON public.store_items
FOR SELECT
USING (is_active = true);

-- Create user_purchases table to track what users have bought
CREATE TABLE public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_item_id UUID NOT NULL REFERENCES public.store_items(id),
  coins_spent INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_purchases
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for user_purchases
CREATE POLICY "Users can view their own purchases"
ON public.user_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.user_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to handle tap coin transactions
CREATE OR REPLACE FUNCTION public.add_tap_coins(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _description TEXT,
  _reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO public.tap_coins_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, _amount, _transaction_type, _description, _reference_id);
  
  -- Update user's balance
  UPDATE public.profiles 
  SET tap_coins_balance = tap_coins_balance + _amount
  WHERE id = _user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create function to spend tap coins
CREATE OR REPLACE FUNCTION public.spend_tap_coins(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _description TEXT,
  _reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT tap_coins_balance INTO current_balance
  FROM public.profiles
  WHERE id = _user_id;
  
  -- Check if user has enough coins
  IF current_balance < _amount THEN
    RETURN FALSE;
  END IF;
  
  -- Insert transaction record (negative amount)
  INSERT INTO public.tap_coins_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, -_amount, _transaction_type, _description, _reference_id);
  
  -- Update user's balance
  UPDATE public.profiles 
  SET tap_coins_balance = tap_coins_balance - _amount
  WHERE id = _user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Insert some sample store items
INSERT INTO public.store_items (name, description, coin_cost, category) VALUES
('XP Boost', 'Double XP for your next workout', 50, 'ability'),
('Workout Tips Pro', 'Unlock advanced form tips and techniques', 100, 'ability'),
('Golden Badge', 'Show off with a premium golden achievement badge', 150, 'cosmetic'),
('Chrome Theme', 'Sleek chrome interface theme', 200, 'cosmetic'),
('Weekly Challenge Entry', 'Enter this week''s premium challenge', 75, 'entry'),
('Monthly Raffle Ticket', 'Entry into monthly prize raffle', 120, 'entry'),
('Premium Workout Plan', 'Custom AI-generated workout plan', 300, 'digital'),
('Personal Record Tracker', 'Advanced PR tracking and analytics', 250, 'digital');