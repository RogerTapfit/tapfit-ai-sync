
-- 1) Private bucket for body scans (private by default)
insert into storage.buckets (id, name, public)
values ('body-scans', 'body-scans', false)
on conflict (id) do nothing;

-- 2) Enum for status (queued|processing|done|error)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'scan_status') then
    create type scan_status as enum ('queued','processing','done','error');
  end if;
end $$;

-- 3) Extend public.body_scans with paths, status, error, metrics, summary, updated_at
alter table public.body_scans
  add column if not exists front_path text,
  add column if not exists left_path text,
  add column if not exists right_path text,
  add column if not exists back_path text,
  add column if not exists status scan_status not null default 'queued',
  add column if not exists error text,
  add column if not exists metrics jsonb,
  add column if not exists summary jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- 4) Ensure RLS is enabled on body_scans (existing owner-only policies already cover this)
alter table public.body_scans enable row level security;

-- 5) Storage policies for bucket 'body-scans'
-- Objects will be named: body-scans/{user_id}/{scan_id}/{view}.jpg
-- Create policies only if they don't already exist
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bs_upload_own_scan'
  ) then
    create policy "bs_upload_own_scan"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'body-scans'
      and split_part(name,'/',1) = auth.uid()::text
      and exists (
        select 1 from public.body_scans bs
        where bs.id::text = split_part(name,'/',2)
          and bs.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bs_read_own_scan'
  ) then
    create policy "bs_read_own_scan"
    on storage.objects for select to authenticated
    using (
      bucket_id = 'body-scans'
      and split_part(name,'/',1) = auth.uid()::text
      and exists (
        select 1 from public.body_scans bs
        where bs.id::text = split_part(name,'/',2)
          and bs.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bs_update_own_scan'
  ) then
    create policy "bs_update_own_scan"
    on storage.objects for update to authenticated
    using (
      bucket_id = 'body-scans'
      and split_part(name,'/',1) = auth.uid()::text
      and exists (
        select 1 from public.body_scans bs
        where bs.id::text = split_part(name,'/',2)
          and bs.user_id = auth.uid()
      )
    )
    with check (
      bucket_id = 'body-scans'
      and split_part(name,'/',1) = auth.uid()::text
      and exists (
        select 1 from public.body_scans bs
        where bs.id::text = split_part(name,'/',2)
          and bs.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bs_delete_own_scan'
  ) then
    create policy "bs_delete_own_scan"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'body-scans'
      and split_part(name,'/',1) = auth.uid()::text
      and exists (
        select 1 from public.body_scans bs
        where bs.id::text = split_part(name,'/',2)
          and bs.user_id = auth.uid()
      )
    );
  end if;
end $$;

-- 6) Helpful indexes
create index if not exists idx_body_scans_user_created
  on public.body_scans (user_id, created_at desc);

create index if not exists idx_body_scans_user_updated
  on public.body_scans (user_id, updated_at desc);

create index if not exists idx_body_scans_status
  on public.body_scans (status);

-- GIN index for metrics queries
create index if not exists idx_body_scans_metrics_gin
  on public.body_scans using gin (metrics jsonb_path_ops);

-- 7) updated_at trigger for body_scans (re-use existing function)
drop trigger if exists set_updated_at_on_body_scans on public.body_scans;
create trigger set_updated_at_on_body_scans
before update on public.body_scans
for each row execute procedure public.update_updated_at_column();
