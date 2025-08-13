
-- Grant 'admin' role to your current user (only if not already admin)
-- User detected from your current session logs: f2d7d1ca-0cd7-42de-beca-353e0f933eeb

INSERT INTO public.user_roles (user_id, role)
SELECT 'f2d7d1ca-0cd7-42de-beca-353e0f933eeb'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'f2d7d1ca-0cd7-42de-beca-353e0f933eeb'::uuid
    AND role = 'admin'::app_role
);
