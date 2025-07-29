-- Insert sample workout exercises for scheduled workouts
-- Using valid exercise types based on the constraint

-- For Chest/Shoulders/Triceps workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.exercise_type,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Chest Press Machine', 'strength', 3, 12, 90, 1),
    ('Pec Deck (Butterfly) Machine', 'strength', 3, 15, 60, 2),
    ('Shoulder Press Machine', 'strength', 3, 10, 90, 3),
    ('Triceps Pushdown', 'strength', 3, 12, 60, 4)
) AS exercise_data(machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'chest_shoulders_triceps';

-- For Back/Biceps workouts  
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.exercise_type,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Lat Pulldown Machine', 'strength', 3, 12, 90, 1),
    ('Seated Row Machine', 'strength', 3, 10, 90, 2),
    ('Cable Face Pulls', 'strength', 3, 15, 60, 3),
    ('Biceps Curl Machine', 'strength', 3, 12, 60, 4)
) AS exercise_data(machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'back_biceps';

-- For Legs/Core workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.exercise_type,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Leg Press Machine', 'strength', 3, 15, 120, 1),
    ('Leg Extension Machine', 'strength', 3, 12, 60, 2),
    ('Leg Curl Machine', 'strength', 3, 12, 60, 3),
    ('Ab Crunch Machine', 'strength', 3, 20, 45, 4)
) AS exercise_data(machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'legs_core';

-- For Upper Body/Core workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.exercise_type,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Smith Machine Press', 'strength', 3, 10, 120, 1),
    ('Cable Lateral Raises', 'strength', 3, 12, 60, 2),
    ('Seated Cable Row', 'strength', 3, 10, 90, 3),
    ('Hanging Leg Raises', 'strength', 3, 15, 60, 4)
) AS exercise_data(machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'upper_body_core';

-- For Glutes/Conditioning workouts
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
SELECT 
  sw.id,
  exercise_data.machine_name,
  exercise_data.exercise_type,
  exercise_data.sets,
  exercise_data.reps,
  exercise_data.rest_seconds,
  exercise_data.exercise_order
FROM scheduled_workouts sw
CROSS JOIN (
  VALUES
    ('Hip Abduction Machine', 'strength', 3, 15, 60, 1),
    ('Glute Kickback Machine', 'strength', 3, 12, 60, 2),
    ('Cable Pull-through', 'strength', 3, 15, 60, 3),
    ('Stair Climber', 'strength', 1, 1, 0, 4)
) AS exercise_data(machine_name, exercise_type, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'glutes_conditioning';

-- Update the stair climber with duration instead of reps for cardio exercises
UPDATE workout_exercises 
SET duration_minutes = 15, reps = NULL
WHERE machine_name = 'Stair Climber';