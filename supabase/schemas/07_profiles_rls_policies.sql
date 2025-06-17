alter table public.profiles enable row level security;

create policy "Allow public read access to profiles"
on public.profiles
for select
to authenticated, anon
using (true);

create policy "Allow user to create own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Allow user to update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Allow user to delete own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);
