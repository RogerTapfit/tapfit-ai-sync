BEGIN;
-- Remove existing entries with these names to avoid duplicates
DELETE FROM public.avatars 
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

-- Insert the 9 avatars using the uploaded images
INSERT INTO public.avatars (is_active, sort_order, name, image_url, mini_image_url)
VALUES
  (true, 1, 'Nova Hawk', '/lovable-uploads/0d9b2a95-f255-4a68-a040-7998a9ffb1cf.png', '/lovable-uploads/0d9b2a95-f255-4a68-a040-7998a9ffb1cf.png'),
  (true, 2, 'Camotron', '/lovable-uploads/17d0bcc0-6b5c-4941-bd0e-5d2e09a889bf.png', '/lovable-uploads/17d0bcc0-6b5c-4941-bd0e-5d2e09a889bf.png'),
  (true, 3, 'Nano Panda', '/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png', '/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png'),
  (true, 4, 'Volt Cheetah', '/lovable-uploads/28009a8a-51b5-4196-bd00-c1ad68b67bc0.png', '/lovable-uploads/28009a8a-51b5-4196-bd00-c1ad68b67bc0.png'),
  (true, 5, 'Luna Fox', '/lovable-uploads/29c29f8b-9b3a-4013-ac88-068a86133fae.png', '/lovable-uploads/29c29f8b-9b3a-4013-ac88-068a86133fae.png'),
  (true, 6, 'Crimson Core', '/lovable-uploads/2b2aecd1-f6b4-4ab2-b6ac-a84e73d03988.png', '/lovable-uploads/2b2aecd1-f6b4-4ab2-b6ac-a84e73d03988.png'),
  (true, 7, 'Titan Rex', '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png', '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png'),
  (true, 8, 'Steel Simian', '/lovable-uploads/38d95bb2-864a-409d-923d-e5dae4595dcd.png', '/lovable-uploads/38d95bb2-864a-409d-923d-e5dae4595dcd.png'),
  (true, 9, 'Rogue Bull', '/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png', '/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png');

COMMIT;