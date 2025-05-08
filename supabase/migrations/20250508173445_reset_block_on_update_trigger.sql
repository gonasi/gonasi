create or replace function public.trigger_reset_on_block_update()
returns trigger as $$
declare
  affected_block_id uuid := new.id;
  affected_lesson_id uuid := new.lesson_id;
  user_row record;
begin
  -- Delete all interactions for the updated block
  delete from public.block_interactions
  where block_id = affected_block_id;

  -- Recalculate lesson progress for users who had progress in that lesson
  for user_row in
    select distinct user_id
    from public.lesson_progress
    where lesson_id = affected_lesson_id
  loop
    perform public.recalculate_lesson_progress(user_row.user_id, affected_lesson_id);
  end loop;

  return null;
end;
$$ language plpgsql;


create trigger trg_reset_on_block_update
after update on public.blocks
for each row
execute function public.trigger_reset_on_block_update();
