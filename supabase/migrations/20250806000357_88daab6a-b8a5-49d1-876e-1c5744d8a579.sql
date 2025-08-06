-- Create tables for robot avatar system and NFT integration

-- TapTokens table for premium currency
CREATE TABLE IF NOT EXISTS public.tap_tokens_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Avatar NFTs table for blockchain integration
CREATE TABLE IF NOT EXISTS public.avatar_nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_config JSONB NOT NULL,
  nft_metadata JSONB NOT NULL,
  blockchain_address TEXT,
  token_id TEXT,
  serial_number INTEGER,
  rarity_tier TEXT NOT NULL DEFAULT 'common',
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loot boxes table for randomized rewards
CREATE TABLE IF NOT EXISTS public.loot_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tap_token_cost INTEGER NOT NULL,
  rarity_tier TEXT NOT NULL DEFAULT 'common',
  guaranteed_rewards JSONB NOT NULL DEFAULT '[]',
  possible_rewards JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User loot box openings
CREATE TABLE IF NOT EXISTS public.user_loot_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  loot_box_id UUID NOT NULL,
  rewards_received JSONB NOT NULL,
  tokens_spent INTEGER NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Avatar power-ups that link to app functionality
CREATE TABLE IF NOT EXISTS public.avatar_power_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  power_type TEXT NOT NULL,
  unlock_condition JSONB,
  app_functionality JSONB NOT NULL,
  visual_component TEXT,
  coin_cost INTEGER DEFAULT 0,
  token_cost INTEGER DEFAULT 0,
  rarity_tier TEXT NOT NULL DEFAULT 'common',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User owned power-ups
CREATE TABLE IF NOT EXISTS public.user_power_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  power_up_id UUID NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER DEFAULT 0
);

-- Avatar achievements linking fitness milestones to avatar rewards
CREATE TABLE IF NOT EXISTS public.avatar_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB NOT NULL,
  avatar_reward JSONB,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tap_tokens_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loot_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tap_tokens_transactions
CREATE POLICY "Users can view their own token transactions" 
ON public.tap_tokens_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token transactions" 
ON public.tap_tokens_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for avatar_nfts
CREATE POLICY "Users can view their own NFTs" 
ON public.avatar_nfts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own NFTs" 
ON public.avatar_nfts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own NFTs" 
ON public.avatar_nfts FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for loot_boxes
CREATE POLICY "Everyone can view active loot boxes" 
ON public.loot_boxes FOR SELECT 
USING (is_active = true);

-- RLS Policies for user_loot_openings
CREATE POLICY "Users can view their own loot openings" 
ON public.user_loot_openings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loot openings" 
ON public.user_loot_openings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for avatar_power_ups
CREATE POLICY "Everyone can view active power-ups" 
ON public.avatar_power_ups FOR SELECT 
USING (is_active = true);

-- RLS Policies for user_power_ups
CREATE POLICY "Users can view their own power-ups" 
ON public.user_power_ups FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own power-ups" 
ON public.user_power_ups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own power-ups" 
ON public.user_power_ups FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for avatar_achievements
CREATE POLICY "Users can view their own avatar achievements" 
ON public.avatar_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatar achievements" 
ON public.avatar_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add TapTokens balance to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tap_tokens_balance INTEGER NOT NULL DEFAULT 0;

-- Update avatar_data structure to support robot features
-- This extends the existing JSONB column to include robot-specific properties
-- The existing avatar_data will be backward compatible

-- Functions for TapTokens management
CREATE OR REPLACE FUNCTION public.add_tap_tokens(_user_id uuid, _amount integer, _transaction_type text, _description text, _reference_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert transaction record
  INSERT INTO public.tap_tokens_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, _amount, _transaction_type, _description, _reference_id);
  
  -- Update user's token balance
  UPDATE public.profiles 
  SET tap_tokens_balance = tap_tokens_balance + _amount
  WHERE id = _user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.spend_tap_tokens(_user_id uuid, _amount integer, _transaction_type text, _description text, _reference_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Check current token balance
  SELECT tap_tokens_balance INTO current_balance
  FROM public.profiles
  WHERE id = _user_id;
  
  -- Check if user has enough tokens
  IF current_balance < _amount THEN
    RETURN FALSE;
  END IF;
  
  -- Insert transaction record (negative amount)
  INSERT INTO public.tap_tokens_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, -_amount, _transaction_type, _description, _reference_id);
  
  -- Update user's token balance
  UPDATE public.profiles 
  SET tap_tokens_balance = tap_tokens_balance - _amount
  WHERE id = _user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

-- Function to generate NFT metadata from avatar config
CREATE OR REPLACE FUNCTION public.generate_nft_metadata(_avatar_config jsonb, _serial_number integer)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  metadata JSONB;
  rarity_score INTEGER := 0;
  rarity_tier TEXT;
BEGIN
  -- Calculate rarity based on avatar configuration
  -- Add rarity points for different components
  IF (_avatar_config->>'chassis_type') != 'slim_bot' THEN rarity_score := rarity_score + 10; END IF;
  IF (_avatar_config->>'color_scheme') IS NOT NULL THEN rarity_score := rarity_score + 5; END IF;
  IF (_avatar_config->>'tech_modules') IS NOT NULL THEN rarity_score := rarity_score + 15; END IF;
  IF (_avatar_config->>'power_level')::INTEGER > 50 THEN rarity_score := rarity_score + 20; END IF;
  
  -- Determine rarity tier
  rarity_tier := CASE
    WHEN rarity_score >= 40 THEN 'legendary'
    WHEN rarity_score >= 25 THEN 'epic'
    WHEN rarity_score >= 15 THEN 'rare'
    ELSE 'common'
  END;
  
  -- Build NFT metadata
  metadata := jsonb_build_object(
    'name', 'TapFit Robot Avatar #' || _serial_number,
    'description', 'A unique fitness robot companion from the TapFit universe',
    'image', 'https://tapfit-avatars.com/nft/' || _serial_number || '.png',
    'external_url', 'https://tapfit.app/avatar/' || _serial_number,
    'attributes', jsonb_build_array(
      jsonb_build_object('trait_type', 'Chassis Type', 'value', _avatar_config->>'chassis_type'),
      jsonb_build_object('trait_type', 'Rarity', 'value', rarity_tier),
      jsonb_build_object('trait_type', 'Power Level', 'value', (_avatar_config->>'power_level')::INTEGER),
      jsonb_build_object('trait_type', 'Serial Number', 'value', _serial_number)
    ),
    'rarity_score', rarity_score,
    'rarity_tier', rarity_tier,
    'avatar_config', _avatar_config
  );
  
  RETURN metadata;
END;
$function$;