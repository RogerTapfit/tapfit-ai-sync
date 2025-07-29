-- Insert sample workout exercises for scheduled workouts
-- Properly handling the constraint: either sets/reps OR duration_minutes, not both

-- For Chest/Shoulders/Triceps workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Chest Press Machine', 3, 12, 90, 1),
    ('Pec Deck (Butterfly) Machine', 3, 15, 60, 2),
    ('Shoulder Press Machine', 3, 10, 90, 3),
    ('Triceps Pushdown', 3, 12, 60, 4)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'chest_shoulders_triceps';

-- For Back/Biceps workouts  
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Lat Pulldown Machine', 3, 12, 90, 1),
    ('Seated Row Machine', 3, 10, 90, 2),
    ('Cable Face Pulls', 3, 15, 60, 3),
    ('Biceps Curl Machine', 3, 12, 60, 4)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'back_biceps';

-- For Legs/Core workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Leg Press Machine', 3, 15, 120, 1),
    ('Leg Extension Machine', 3, 12, 60, 2),
    ('Leg Curl Machine', 3, 12, 60, 3),
    ('Ab Crunch Machine', 3, 20, 45, 4)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'legs_core';

-- For Upper Body/Core workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Smith Machine Press', 3, 10, 120, 1),
    ('Cable Lateral Raises', 3, 12, 60, 2),
    ('Seated Cable Row', 3, 10, 90, 3),
    ('Hanging Leg Raises', 3, 15, 60, 4)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'upper_body_core';

-- For Glutes/Conditioning workouts (mix of strength and cardio)
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Hip Abduction Machine', 3, 15, 60, 1),
    ('Glute Kickback Machine', 3, 12, 60, 2),
    ('Cable Pull-through', 3, 15, 60, 3)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'glutes_conditioning';

-- Add cardio exercise with duration for Glutes/Conditioning
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, duration_minutes, rest_seconds, exercise_order)
SELECT 
  sw.id,
  'Stair Climber',
  15,
  0,
  4
FROM scheduled_workouts sw
WHERE sw.target_muscle_group = 'glutes_conditioning';