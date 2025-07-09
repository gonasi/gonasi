create or replace function public.set_chapter_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.chapters
    where course_id = new.course_id;
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_chapter_position
before insert on public.chapters
for each row
execute function set_chapter_position();