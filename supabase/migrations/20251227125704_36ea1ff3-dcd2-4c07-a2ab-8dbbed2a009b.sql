-- Hide the newly generated avatars (keep them in database but hide from users)
UPDATE public.avatars 
SET is_active = false 
WHERE name IN ('Luna', 'Pixie', 'Blaze', 'Titan', 'Storm');