-- Smart Injury Prevention System Tables

-- Form Analysis Logs: Store historical form data per exercise session
CREATE TABLE public.form_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_log_id UUID REFERENCES public.exercise_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  avg_form_score INTEGER,
  
  -- Side-by-side comparison (for imbalance detection)
  left_side_score INTEGER,
  right_side_score INTEGER,
  imbalance_percentage NUMERIC(5,2),
  imbalance_direction TEXT, -- 'left_weak', 'right_weak', 'balanced'
  
  -- Specific form issues detected
  form_issues JSONB DEFAULT '[]'::jsonb,
  joint_warnings JSONB DEFAULT '[]'::jsonb,
  
  -- Injury risk indicators
  injury_risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  flagged_patterns TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_analysis_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own form logs" ON public.form_analysis_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own form logs" ON public.form_analysis_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form logs" ON public.form_analysis_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own form logs" ON public.form_analysis_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_form_analysis_user_date ON public.form_analysis_logs (user_id, created_at DESC);
CREATE INDEX idx_form_analysis_exercise ON public.form_analysis_logs (user_id, exercise_name);


-- Muscle Imbalance Tracking: Track imbalances over time
CREATE TABLE public.muscle_imbalance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  muscle_group TEXT NOT NULL,
  
  -- Imbalance data
  dominant_side TEXT DEFAULT 'balanced', -- 'left', 'right', 'balanced'
  imbalance_percentage NUMERIC(5,2) DEFAULT 0,
  trend TEXT DEFAULT 'stable', -- 'improving', 'worsening', 'stable'
  
  -- Historical averages
  avg_left_strength INTEGER DEFAULT 0,
  avg_right_strength INTEGER DEFAULT 0,
  data_points_count INTEGER DEFAULT 0,
  
  -- Risk assessment
  injury_risk_score INTEGER DEFAULT 0, -- 0-100
  recommended_focus TEXT,
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, muscle_group)
);

-- Enable RLS
ALTER TABLE public.muscle_imbalance_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own imbalance data" ON public.muscle_imbalance_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own imbalance data" ON public.muscle_imbalance_tracking
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_imbalance_user ON public.muscle_imbalance_tracking (user_id);


-- Corrective Exercises: Reference table for recommended corrective exercises
CREATE TABLE public.corrective_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_issue TEXT NOT NULL, -- 'knee_valgus', 'hip_imbalance', 'shoulder_weakness'
  exercise_name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 12,
  difficulty TEXT DEFAULT 'beginner',
  muscle_groups TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (public read, admin write)
ALTER TABLE public.corrective_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active corrective exercises" ON public.corrective_exercises
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage corrective exercises" ON public.corrective_exercises
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Index
CREATE INDEX idx_corrective_target ON public.corrective_exercises (target_issue);


-- Insert default corrective exercises
INSERT INTO public.corrective_exercises (target_issue, exercise_name, description, instructions, sets, reps, difficulty, muscle_groups) VALUES
-- Knee issues
('knee_valgus', 'Clamshells', 'Strengthens hip abductors to prevent knee cave', 'Lie on side, knees bent 90°, lift top knee while keeping feet together', 3, 15, 'beginner', ARRAY['glutes', 'hip_abductors']),
('knee_valgus', 'Monster Walks', 'Improves hip stability and glute activation', 'Place band above knees, walk sideways maintaining tension', 3, 10, 'beginner', ARRAY['glutes', 'hip_abductors']),
('knee_valgus', 'Single-Leg Glute Bridge', 'Builds unilateral hip strength', 'Bridge up on one leg, keep hips level', 3, 12, 'intermediate', ARRAY['glutes', 'hamstrings']),

-- Hip issues
('hip_imbalance', 'Single-Leg Deadlift', 'Addresses hip stability asymmetry', 'Stand on one leg, hinge forward keeping back straight', 3, 10, 'intermediate', ARRAY['hamstrings', 'glutes', 'core']),
('hip_imbalance', 'Hip Flexor Stretch', 'Releases tight hip flexors', 'Kneel in lunge, push hips forward gently', 3, 30, 'beginner', ARRAY['hip_flexors']),
('hip_imbalance', 'Pigeon Pose', 'Opens tight hips and improves mobility', 'Front leg bent, back leg extended, fold forward', 3, 30, 'beginner', ARRAY['glutes', 'hip_rotators']),

-- Shoulder issues
('shoulder_imbalance', 'Face Pulls', 'Strengthens rear delts and external rotators', 'Pull rope to face, squeeze shoulder blades', 3, 15, 'beginner', ARRAY['rear_delts', 'rotator_cuff']),
('shoulder_imbalance', 'External Rotation', 'Targets rotator cuff weakness', 'Elbow at side, rotate forearm outward against resistance', 3, 15, 'beginner', ARRAY['rotator_cuff']),
('shoulder_imbalance', 'Prone Y Raises', 'Strengthens lower trapezius', 'Lie face down, lift arms in Y position', 3, 12, 'beginner', ARRAY['lower_traps', 'rear_delts']),

-- Core and posture
('core_weakness', 'Dead Bug', 'Builds core stability and coordination', 'Lie on back, alternate extending opposite arm and leg', 3, 10, 'beginner', ARRAY['core', 'hip_flexors']),
('core_weakness', 'Pallof Press', 'Anti-rotation core strength', 'Press band straight out, resist rotation', 3, 12, 'intermediate', ARRAY['core', 'obliques']),

-- Back issues
('lower_back_weakness', 'Bird Dog', 'Improves spinal stability', 'On all fours, extend opposite arm and leg', 3, 10, 'beginner', ARRAY['core', 'lower_back', 'glutes']),
('lower_back_weakness', 'Cat-Cow Stretch', 'Mobilizes spine and releases tension', 'Alternate arching and rounding spine', 3, 10, 'beginner', ARRAY['spine', 'core']);


-- Function to calculate injury risk score
CREATE OR REPLACE FUNCTION public.calculate_injury_risk_score(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  avg_form_score NUMERIC;
  imbalance_count INTEGER;
  high_risk_issues INTEGER;
  risk_score INTEGER := 0;
BEGIN
  -- Get average form score from last 30 days
  SELECT COALESCE(AVG(avg_form_score), 100)
  INTO avg_form_score
  FROM form_analysis_logs
  WHERE user_id = _user_id AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Count significant imbalances (>15%)
  SELECT COUNT(*)
  INTO imbalance_count
  FROM muscle_imbalance_tracking
  WHERE user_id = _user_id AND imbalance_percentage > 15;
  
  -- Count high-risk form issues
  SELECT COUNT(*)
  INTO high_risk_issues
  FROM form_analysis_logs
  WHERE user_id = _user_id 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND injury_risk_level = 'high';
  
  -- Calculate risk score (0-100, higher = more risk)
  risk_score := GREATEST(0, LEAST(100,
    (100 - avg_form_score) * 0.4 + -- Form score impact (40%)
    imbalance_count * 15 +          -- Each imbalance adds 15 points
    high_risk_issues * 10           -- Each high-risk session adds 10
  ))::INTEGER;
  
  RETURN risk_score;
END;
$$;


-- Function to update muscle imbalance tracking
CREATE OR REPLACE FUNCTION public.update_muscle_imbalance(_user_id UUID, _muscle_group TEXT, _left_score INTEGER, _right_score INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  imbalance_pct NUMERIC;
  dominant TEXT;
  prev_pct NUMERIC;
  new_trend TEXT;
BEGIN
  -- Calculate imbalance
  IF _left_score > 0 AND _right_score > 0 THEN
    imbalance_pct := ABS(_left_score - _right_score)::NUMERIC / GREATEST(_left_score, _right_score) * 100;
    
    IF _left_score > _right_score + 5 THEN
      dominant := 'left';
    ELSIF _right_score > _left_score + 5 THEN
      dominant := 'right';
    ELSE
      dominant := 'balanced';
    END IF;
  ELSE
    imbalance_pct := 0;
    dominant := 'balanced';
  END IF;
  
  -- Get previous imbalance for trend
  SELECT imbalance_percentage INTO prev_pct
  FROM muscle_imbalance_tracking
  WHERE user_id = _user_id AND muscle_group = _muscle_group;
  
  -- Calculate trend
  IF prev_pct IS NULL THEN
    new_trend := 'stable';
  ELSIF imbalance_pct < prev_pct - 2 THEN
    new_trend := 'improving';
  ELSIF imbalance_pct > prev_pct + 2 THEN
    new_trend := 'worsening';
  ELSE
    new_trend := 'stable';
  END IF;
  
  -- Upsert tracking record
  INSERT INTO muscle_imbalance_tracking (
    user_id, muscle_group, dominant_side, imbalance_percentage, trend,
    avg_left_strength, avg_right_strength, data_points_count,
    injury_risk_score, last_updated
  ) VALUES (
    _user_id, _muscle_group, dominant, imbalance_pct, new_trend,
    _left_score, _right_score, 1,
    CASE WHEN imbalance_pct > 20 THEN 75 WHEN imbalance_pct > 15 THEN 50 WHEN imbalance_pct > 10 THEN 25 ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id, muscle_group) DO UPDATE SET
    dominant_side = EXCLUDED.dominant_side,
    imbalance_percentage = EXCLUDED.imbalance_percentage,
    trend = new_trend,
    avg_left_strength = (muscle_imbalance_tracking.avg_left_strength * muscle_imbalance_tracking.data_points_count + _left_score) / (muscle_imbalance_tracking.data_points_count + 1),
    avg_right_strength = (muscle_imbalance_tracking.avg_right_strength * muscle_imbalance_tracking.data_points_count + _right_score) / (muscle_imbalance_tracking.data_points_count + 1),
    data_points_count = muscle_imbalance_tracking.data_points_count + 1,
    injury_risk_score = CASE WHEN EXCLUDED.imbalance_percentage > 20 THEN 75 WHEN EXCLUDED.imbalance_percentage > 15 THEN 50 WHEN EXCLUDED.imbalance_percentage > 10 THEN 25 ELSE 0 END,
    last_updated = now();
END;
$$;