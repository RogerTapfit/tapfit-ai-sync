-- Create table for crowdsourced machine weight specifications (network effect)
CREATE TABLE public.machine_weight_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name TEXT NOT NULL,
  machine_type TEXT,
  min_weight INTEGER,
  max_weight INTEGER,
  weight_increment INTEGER DEFAULT 5,
  gym_id UUID REFERENCES public.gyms(id),
  contributions_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index that handles NULL gym_id
CREATE UNIQUE INDEX idx_machine_weight_specs_unique 
ON public.machine_weight_specs(machine_name, COALESCE(gym_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Create table for user personal maxes tracking
CREATE TABLE public.user_machine_maxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_name TEXT NOT NULL,
  is_at_machine_max BOOLEAN DEFAULT false,
  is_at_machine_min BOOLEAN DEFAULT false,
  personal_max_weight INTEGER,
  typical_reps INTEGER,
  typical_weight INTEGER,
  last_workout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, machine_name)
);

-- Enable RLS
ALTER TABLE public.machine_weight_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machine_maxes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for machine_weight_specs (crowdsourced = everyone can read)
CREATE POLICY "Everyone can view machine specs"
ON public.machine_weight_specs
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert machine specs"
ON public.machine_weight_specs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update machine specs"
ON public.machine_weight_specs
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for user_machine_maxes (personal data)
CREATE POLICY "Users can view their own machine maxes"
ON public.user_machine_maxes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own machine maxes"
ON public.user_machine_maxes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own machine maxes"
ON public.user_machine_maxes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own machine maxes"
ON public.user_machine_maxes
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_machine_weight_specs_name ON public.machine_weight_specs(machine_name);
CREATE INDEX idx_user_machine_maxes_user ON public.user_machine_maxes(user_id);
CREATE INDEX idx_user_machine_maxes_machine ON public.user_machine_maxes(machine_name);

-- Function to upsert machine specs with contribution counting
CREATE OR REPLACE FUNCTION public.contribute_machine_spec(
  _machine_name TEXT,
  _machine_type TEXT DEFAULT NULL,
  _min_weight INTEGER DEFAULT NULL,
  _max_weight INTEGER DEFAULT NULL,
  _weight_increment INTEGER DEFAULT 5,
  _gym_id UUID DEFAULT NULL
)
RETURNS public.machine_weight_specs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.machine_weight_specs;
  existing_id UUID;
BEGIN
  -- Check if spec already exists
  SELECT id INTO existing_id
  FROM public.machine_weight_specs
  WHERE machine_name = _machine_name 
    AND COALESCE(gym_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(_gym_id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF existing_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.machine_weight_specs
    SET 
      min_weight = COALESCE(_min_weight, min_weight),
      max_weight = COALESCE(_max_weight, max_weight),
      weight_increment = COALESCE(_weight_increment, weight_increment),
      contributions_count = contributions_count + 1,
      last_updated = now()
    WHERE id = existing_id
    RETURNING * INTO result;
  ELSE
    -- Insert new
    INSERT INTO public.machine_weight_specs (
      machine_name, machine_type, min_weight, max_weight, weight_increment, gym_id
    ) VALUES (
      _machine_name, _machine_type, _min_weight, _max_weight, _weight_increment, _gym_id
    )
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$;

-- Function to upsert user machine maxes
CREATE OR REPLACE FUNCTION public.update_user_machine_max(
  _user_id UUID,
  _machine_name TEXT,
  _is_at_machine_max BOOLEAN DEFAULT NULL,
  _is_at_machine_min BOOLEAN DEFAULT NULL,
  _personal_max_weight INTEGER DEFAULT NULL,
  _typical_reps INTEGER DEFAULT NULL,
  _typical_weight INTEGER DEFAULT NULL
)
RETURNS public.user_machine_maxes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_machine_maxes;
BEGIN
  INSERT INTO public.user_machine_maxes (
    user_id, machine_name, is_at_machine_max, is_at_machine_min, 
    personal_max_weight, typical_reps, typical_weight, last_workout_date
  ) VALUES (
    _user_id, _machine_name, COALESCE(_is_at_machine_max, false), COALESCE(_is_at_machine_min, false),
    _personal_max_weight, _typical_reps, _typical_weight, now()
  )
  ON CONFLICT (user_id, machine_name)
  DO UPDATE SET
    is_at_machine_max = COALESCE(_is_at_machine_max, user_machine_maxes.is_at_machine_max),
    is_at_machine_min = COALESCE(_is_at_machine_min, user_machine_maxes.is_at_machine_min),
    personal_max_weight = GREATEST(COALESCE(_personal_max_weight, 0), COALESCE(user_machine_maxes.personal_max_weight, 0)),
    typical_reps = COALESCE(_typical_reps, user_machine_maxes.typical_reps),
    typical_weight = COALESCE(_typical_weight, user_machine_maxes.typical_weight),
    last_workout_date = now(),
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;