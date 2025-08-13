
-- Update Nova Hawk to use the newly provided image for both main and mini
UPDATE public.avatars
SET
  image_url = '/lovable-uploads/6dce4d2e-a702-4ee6-86e8-3471cb8265a3.png',
  mini_image_url = '/lovable-uploads/6dce4d2e-a702-4ee6-86e8-3471cb8265a3.png',
  is_active = true
WHERE name = 'Nova Hawk' AND is_active = true;
