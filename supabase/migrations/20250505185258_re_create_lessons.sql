create or replace function public.reorder_lessons(lessons jsonb)
returns void
language plpgsql
security definer
as $$
declare
  target_chapter_id uuid;
begin
  -- Extract chapter_id from the first item in the array
  target_chapter_id := (lessons->0->>'chapter_id')::uuid;

  -- Temporarily offset existing lesson positions to avoid unique constraint conflicts
  update public.lessons
  set position = position + 1000000
  where chapter_id = target_chapter_id;

  -- Update positions based on the input array
  update public.lessons as l
  set 
    position = new_data.position,
    updated_by = new_data.updated_by,
    updated_at = timezone('utc', now())
  from (
    select 
      (elem->>'id')::uuid as id,
      (elem->>'position')::int as position,
      (elem->>'updated_by')::uuid as updated_by
    from jsonb_array_elements(lessons) as elem
  ) as new_data
  where l.id = new_data.id;
end;
$$;