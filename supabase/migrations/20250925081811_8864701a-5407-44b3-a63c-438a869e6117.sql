-- Create the missing beginner muscle_building template
INSERT INTO public.monthly_workout_templates (
  fitness_level,
  primary_goal,
  template_data,
  week_structure,
  is_active
) VALUES (
  'beginner',
  'muscle_building',
  '{
    "exercises_per_day": 6,
    "rest_between_sets": 90,
    "progressive_overload": 0.05,
    "volume_emphasis": 1.2,
    "strength_emphasis": 0.8,
    "cardio_ratio": 0.2,
    "focus_areas": ["form", "consistency", "progressive_loading"],
    "injury_prevention": true
  }'::jsonb,
  '{
    "week1": {"intensity": 0.6, "focus": "form_learning"},
    "week2": {"intensity": 0.7, "focus": "muscle_activation"},
    "week3": {"intensity": 0.8, "focus": "progressive_overload"},
    "week4": {"intensity": 0.75, "focus": "recovery_prep"}
  }'::jsonb,
  true
);

-- Also create intermediate muscle_building template for better coverage
INSERT INTO public.monthly_workout_templates (
  fitness_level,
  primary_goal,
  template_data,
  week_structure,
  is_active
) VALUES (
  'intermediate',
  'muscle_building',
  '{
    "exercises_per_day": 7,
    "rest_between_sets": 75,
    "progressive_overload": 0.075,
    "volume_emphasis": 1.4,
    "strength_emphasis": 1.0,
    "cardio_ratio": 0.15,
    "focus_areas": ["muscle_confusion", "volume_progression", "technique_refinement"],
    "injury_prevention": true
  }'::jsonb,
  '{
    "week1": {"intensity": 0.7, "focus": "volume_building"},
    "week2": {"intensity": 0.8, "focus": "intensity_increase"},
    "week3": {"intensity": 0.85, "focus": "peak_training"},
    "week4": {"intensity": 0.6, "focus": "deload_recovery"}
  }'::jsonb,
  true
);

-- Create advanced muscle_building template as well
INSERT INTO public.monthly_workout_templates (
  fitness_level,
  primary_goal,
  template_data,
  week_structure,
  is_active
) VALUES (
  'advanced',
  'muscle_building',
  '{
    "exercises_per_day": 8,
    "rest_between_sets": 60,
    "progressive_overload": 0.1,
    "volume_emphasis": 1.6,
    "strength_emphasis": 1.2,
    "cardio_ratio": 0.1,
    "focus_areas": ["advanced_techniques", "periodization", "specialization"],
    "injury_prevention": true
  }'::jsonb,
  '{
    "week1": {"intensity": 0.8, "focus": "high_volume"},
    "week2": {"intensity": 0.9, "focus": "intensity_peak"},
    "week3": {"intensity": 0.95, "focus": "maximum_effort"},
    "week4": {"intensity": 0.7, "focus": "active_recovery"}
  }'::jsonb,
  true
);