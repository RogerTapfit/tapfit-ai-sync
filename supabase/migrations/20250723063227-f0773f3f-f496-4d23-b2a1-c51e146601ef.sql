-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS public.add_tap_coins(UUID, INTEGER, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.spend_tap_coins(UUID, INTEGER, TEXT, TEXT, UUID);

-- Create function to handle tap coin transactions with proper security
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
SET search_path = ''
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

-- Create function to spend tap coins with proper security
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
SET search_path = ''
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