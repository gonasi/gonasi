insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Allow public access to avatar images"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "Allow uploading avatar images"
on storage.objects
for insert
with check (bucket_id = 'avatars');

create policy "Allow user to update own avatar"
on storage.objects
for update
using ((select auth.uid()) = owner)
with check (bucket_id = 'avatars');

create policy "Allow user to delete own avatar" 
on storage.objects
for delete
using ((select auth.uid()) = owner and bucket_id = 'avatars'); 
