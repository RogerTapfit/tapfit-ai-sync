-- Body scan tables
CREATE TABLE IF NOT EXISTS public.body_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sex TEXT,
  height_cm INTEGER,
  weight_known_kg INTEGER,
  notes TEXT
);

ALTER TABLE public.body_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own body scans"
ON public.body_scans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own body scans"
ON public.body_scans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own body scans"
ON public.body_scans FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body scans"
ON public.body_scans FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Store per-view features only (no raw photos)
CREATE TABLE IF NOT EXISTS public.body_scan_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.body_scans(id) ON DELETE CASCADE,
  view TEXT NOT NULL CHECK (view IN ('front','left','right','back')),
  landmarks JSONB NOT NULL DEFAULT '[]',
  width_profile JSONB NOT NULL DEFAULT '[]',
  mask_downsampled BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.body_scan_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their body scan images"
ON public.body_scan_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.body_scans s WHERE s.id = body_scan_images.scan_id AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.body_scans s WHERE s.id = body_scan_images.scan_id AND s.user_id = auth.uid()
  )
);

-- Metrics per scan
CREATE TABLE IF NOT EXISTS public.body_scan_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.body_scans(id) ON DELETE CASCADE,
  estimates JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.body_scan_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their body scan metrics"
ON public.body_scan_metrics FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.body_scans s WHERE s.id = body_scan_metrics.scan_id AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.body_scans s WHERE s.id = body_scan_metrics.scan_id AND s.user_id = auth.uid()
  )
);
