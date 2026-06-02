insert into storage.buckets (id, name, public)
values ('pace-media', 'pace-media', true)
on conflict (id) do nothing;

drop policy if exists "pace media is readable" on storage.objects;
create policy "pace media is readable"
  on storage.objects for select
  using (bucket_id = 'pace-media');

drop policy if exists "members can upload pace media" on storage.objects;
create policy "members can upload pace media"
  on storage.objects for insert
  with check (
    bucket_id = 'pace-media'
    and public.is_pace_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "members can update own pace media" on storage.objects;
create policy "members can update own pace media"
  on storage.objects for update
  using (
    bucket_id = 'pace-media'
    and owner = auth.uid()
    and public.is_pace_member((storage.foldername(name))[1]::uuid)
  );
