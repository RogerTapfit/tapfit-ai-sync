-- Re-enable original coach avatars
UPDATE public.avatars 
SET is_active = true 
WHERE name IN (
  'Nova Hawk', 
  'Camotron', 
  'Nano Panda', 
  'Volt Cheetah', 
  'Luna Fox', 
  'Crimson Core', 
  'Titan Rex', 
  'Steel Simian', 
  'Rogue Bull'
);