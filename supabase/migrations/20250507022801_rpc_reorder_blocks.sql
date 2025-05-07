create or replace function public.reorder_blocks(blocks jsonb)
returns void
language plpgsql
security definer
as $$
declare
  target_lesson_id uuid;
  block_count int;
begin
  -- Validate that input is not empty
  block_count := jsonb_array_length(blocks);
  if block_count = 0 then
    raise exception 'No blocks provided to reorder.';
  end if;

  -- Extract the lesson ID from the first block
  target_lesson_id := (blocks->0->>'lesson_id')::uuid;

  -- Step 1: Temporarily shift existing positions to avoid unique constraint conflicts
  update public.blocks
  set position = position + 1000000
  where lesson_id = target_lesson_id;

  -- Step 2: Apply new positions from input
  update public.blocks as b
  set 
    position = new_data.position,
    updated_by = new_data.updated_by,
    updated_at = timezone('utc', now())
  from (
    select 
      (elem->>'id')::uuid as id,
      (elem->>'position')::int as position,
      (elem->>'updated_by')::uuid as updated_by
    from jsonb_array_elements(blocks) as elem
  ) as new_data
  where b.id = new_data.id
    and b.lesson_id = target_lesson_id;
end;
$$;
