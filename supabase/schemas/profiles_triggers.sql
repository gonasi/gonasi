-- Assumes function `update_updated_at_column()` is pre-defined.
create or replace trigger set_updated_at
before update on public.profiles
for each row
execute function update_updated_at_column();
