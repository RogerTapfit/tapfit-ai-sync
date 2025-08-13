
-- 1) Create avatars table
create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,       -- large / primary image
  mini_image_url text not null,  -- small / badge image
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- 2) Enable RLS on avatars and add policies
alter table public.avatars enable row level security;

-- Public can view only active avatars
create policy "avatars_select_active_public"
  on public.avatars
  for select
  using (is_active = true);

-- Admins can insert active/inactive avatars
create policy "avatars_insert_admin_only"
  on public.avatars
  for insert
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update avatars (e.g., name, images, is_active, sort_order)
create policy "avatars_update_admin_only"
  on public.avatars
  for update
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete avatars
create policy "avatars_delete_admin_only"
  on public.avatars
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- 3) Helpful indexes for list performance
create index if not exists avatars_sort_idx on public.avatars (sort_order);
create index if not exists avatars_is_active_idx on public.avatars (is_active);

-- 4) Extend profiles with avatar_id (FK to avatars)
alter table public.profiles
  add column if not exists avatar_id uuid references public.avatars(id) on delete set null;

