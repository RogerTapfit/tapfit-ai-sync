
BEGIN;

-- Deactivate all existing avatars so only the ones below are visible
UPDATE public.avatars SET is_active = false;

-- Insert your 9 avatars in the desired order (mini uses same image)
INSERT INTO public.avatars (is_active, sort_order, name, image_url, mini_image_url) VALUES
  (true, 1, 'Nova Hawk', '/lovable-uploads/8a849486-c79c-42b1-9ba6-52b0989a8cb1.png', '/lovable-uploads/8a849486-c79c-42b1-9ba6-52b0989a8cb1.png'),
  (true, 2, 'Camotron', '/lovable-uploads/6e8ac055-c43c-402e-82e8-f8dbc2df431c.png', '/lovable-uploads/6e8ac055-c43c-402e-82e8-f8dbc2df431c.png'),
  (true, 3, 'Nano Panda', '/lovable-uploads/a9845a09-d2f8-46a7-bf37-7f6cb9478193.png', '/lovable-uploads/a9845a09-d2f8-46a7-bf37-7f6cb9478193.png'),
  (true, 4, 'Volt Cheetah', '/lovable-uploads/abb6cb51-d397-4564-9604-99296bf79d0e.png', '/lovable-uploads/abb6cb51-d397-4564-9604-99296bf79d0e.png'),
  (true, 5, 'Luna Fox', '/lovable-uploads/dadfaf4e-08fb-46bf-95a8-4fb90a66913b.png', '/lovable-uploads/dadfaf4e-08fb-46bf-95a8-4fb90a66913b.png'),
  (true, 6, 'Crimson Core', '/lovable-uploads/56f2ba42-110e-463c-ad9e-6dc209e3f387.png', '/lovable-uploads/56f2ba42-110e-463c-ad9e-6dc209e3f387.png'),
  (true, 7, 'Titan Rex', '/lovable-uploads/286d2e1a-d7b0-4dad-9833-3c967aa1a577.png', '/lovable-uploads/286d2e1a-d7b0-4dad-9833-3c967aa1a577.png'),
  (true, 8, 'Steel Simian', '/lovable-uploads/e2d4ec92-5a57-41b0-914b-9d6c37a6ea35.png', '/lovable-uploads/e2d4ec92-5a57-41b0-914b-9d6c37a6ea35.png'),
  (true, 9, 'Rogue Bull', '/lovable-uploads/3626cd30-4257-4ce8-bc1b-9795fb7f40a8.png', '/lovable-uploads/3626cd30-4257-4ce8-bc1b-9795fb7f40a8.png');

COMMIT;
