alter table public.profiles replica identity full;
alter publication supabase_realtime add table public.profiles;
