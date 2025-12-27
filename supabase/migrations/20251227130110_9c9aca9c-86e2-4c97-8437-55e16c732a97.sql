-- Hide Siren and Velvet avatars
UPDATE public.avatars 
SET is_active = false 
WHERE name IN ('Siren', 'Velvet');