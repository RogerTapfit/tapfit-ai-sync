-- Add 4 more exercises to each existing workout to reach 8 total exercises per workout

-- Additional exercises for Chest/Shoulders/Triceps workouts
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
    ('Incline Chest Press', 3, 10, 90, 5),
    ('Cable Crossover', 3, 12, 60, 6),
    ('Lateral Raise Machine', 3, 15, 60, 7),
    ('Overhead Triceps Extension', 3, 10, 60, 8)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'chest_shoulders_triceps';

-- Additional exercises for Back/Biceps workouts  
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
    ('T-Bar Row Machine', 3, 10, 90, 5),
    ('Wide Grip Pulldown', 3, 12, 90, 6),
    ('Hammer Curl Machine', 3, 12, 60, 7),
    ('Cable Preacher Curls', 3, 15, 60, 8)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'back_biceps';

-- Additional exercises for Legs/Core workouts
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
    ('Hack Squat Machine', 3, 12, 120, 5),
    ('Calf Raise Machine', 3, 20, 60, 6),
    ('Russian Twist Machine', 3, 25, 45, 7),
    ('Leg Raise Station', 3, 15, 60, 8)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'legs_core';

-- Additional exercises for Upper Body/Core workouts
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
    ('Dumbbell Bench Press', 3, 8, 120, 5),
    ('Cable Rear Delt Fly', 3, 15, 60, 6),
    ('Decline Bench Press', 3, 10, 90, 7),
    ('Plank Machine', 3, 12, 60, 8)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'upper_body_core';

-- Additional exercises for Glutes/Conditioning workouts (add 3 more since we already have 4 including Stair Climber)
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
    ('Bulgarian Split Squat', 3, 10, 90, 5),
    ('Glute Ham Raise', 3, 8, 90, 6),
    ('Cable Romanian Deadlift', 3, 12, 90, 7)
) AS exercise_data(machine_name, sets, reps, rest_seconds, exercise_order)
WHERE sw.target_muscle_group = 'glutes_conditioning';

-- Add one more cardio exercise for Glutes/Conditioning to reach 8 total
INSERT INTO workout_exercises (scheduled_workout_id, machine_name, duration_minutes, rest_seconds, exercise_order)
SELECT 
  sw.id,
  'Elliptical Machine',
  10,
  0,
  8
FROM scheduled_workouts sw
WHERE sw.target_muscle_group = 'glutes_conditioning';