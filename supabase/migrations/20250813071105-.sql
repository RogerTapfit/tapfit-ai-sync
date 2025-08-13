-- 1) Ensure unique constraint on avatar names
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_avatars_name'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_avatars_name ON public.avatars (name)';
  END IF;
END $$;

-- 2) Storage policies for character-images bucket
-- Public can view character images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view character images'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Public can view character images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'character-images');
    $$;
  END IF;
END $$;

-- Admins can manage character images (insert/update/delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can manage character images insert'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can manage character images insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'character-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
    $$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can manage character images update'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can manage character images update"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'character-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
    $$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can manage character images delete'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can manage character images delete"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'character-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
    $$;
  END IF;
END $$;

-- 3) Keep ONLY the 9 specified avatars active, with storage URLs
WITH desired AS (
  SELECT * FROM (
    VALUES
      ('Nova Hawk',        1, 'nova-hawk.png'),
      ('Camotron',         2, 'camotron.png'),
      ('Nano Panda',       3, 'nano-panda.png'),
      ('Volt Cheetah',     4, 'volt-cheetah.png'),
      ('Luna Fox',         5, 'luna-fox.png'),
      ('Crimson Core',     6, 'crimson-core.png'),
      ('Titan Rex',        7, 'titan-rex.png'),
      ('Steel Simian',     8, 'steel-simian.png'),
      ('Rogue Bull',       9, 'rogue-bull.png')
  ) AS t(name, sort_order, filename)
)
-- Deactivate any avatars not in desired list
UPDATE public.avatars a
SET is_active = false
WHERE a.name NOT IN (SELECT name FROM desired);

-- Upsert desired avatars pointing to Supabase Storage URLs
INSERT INTO public.avatars (name, sort_order, image_url, mini_image_url, is_active)
SELECT 
  d.name,
  d.sort_order,
  'https://pbrayxmqzdxsmhqmzygc.supabase.co/storage/v1/object/public/character-images/avatars/' || d.filename AS image_url,
  'https://pbrayxmqzdxsmhqmzygc.supabase.co/storage/v1/object/public/character-images/avatars/' || d.filename AS mini_image_url,
  true
FROM desired d
ON CONFLICT (name) DO UPDATE
SET 
  sort_order = EXCLUDED.sort_order,
  image_url = EXCLUDED.image_url,
  mini_image_url = EXCLUDED.mini_image_url,
  is_active = true;