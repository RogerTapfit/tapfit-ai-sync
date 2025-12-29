-- Fix restored walk: assign it to the currently authenticated user
UPDATE public.run_sessions
SET user_id = '287c4417-67b9-436b-91e0-ef59deda0918'
WHERE id = '1475de27-a04d-412d-a980-f4de11b79e43';