-- ====================================================================================
-- FUNCTION: detect_changed_blocks
-- PURPOSE: Detects which blocks have changed between draft and published course
--          by comparing content versions. Returns blocks that are new, modified, or deleted.
-- ====================================================================================
create or replace function public.detect_changed_blocks(
  p_course_id uuid,
  p_published_course_id uuid
)
returns table (
  block_id uuid,
  lesson_id uuid,
  chapter_id uuid,
  change_type text,
  old_version integer,
  new_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_structure jsonb;
begin
  -- Fetch the published course structure
  select course_structure_content
  into published_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  -- If no published version exists, all blocks are new
  if published_structure is null then
    return query
    select
      lb.id as block_id,
      lb.lesson_id,
      lb.chapter_id,
      'new'::text as change_type,
      0 as old_version,
      lb.content_version as new_version
    from public.lesson_blocks lb
    where lb.course_id = p_course_id;
    return;
  end if;

  -- Find modified blocks (where draft version > published version)
  return query
  with published_blocks as (
    select
      (block->>'id')::uuid as block_id,
      (block->>'lesson_id')::uuid as lesson_id,
      (block->>'chapter_id')::uuid as chapter_id,
      coalesce((block->>'content_version')::integer, 1) as content_version
    from public.published_course_structure_content,
      jsonb_path_query(
        course_structure_content,
        '$.chapters[*].lessons[*].blocks[*]'
      ) as block
    where id = p_published_course_id
  ),
  draft_blocks as (
    select
      lb.id as block_id,
      lb.lesson_id,
      lb.chapter_id,
      lb.content_version
    from public.lesson_blocks lb
    where lb.course_id = p_course_id
  )
  -- Modified blocks: version increased
  select
    d.block_id,
    d.lesson_id,
    d.chapter_id,
    'modified'::text as change_type,
    coalesce(p.content_version, 0) as old_version,
    d.content_version as new_version
  from draft_blocks d
  left join published_blocks p on d.block_id = p.block_id
  where d.content_version > coalesce(p.content_version, 0)

  union all

  -- New blocks: exist in draft but not in published
  select
    d.block_id,
    d.lesson_id,
    d.chapter_id,
    'new'::text as change_type,
    0 as old_version,
    d.content_version as new_version
  from draft_blocks d
  left join published_blocks p on d.block_id = p.block_id
  where p.block_id is null

  union all

  -- Deleted blocks: exist in published but not in draft
  select
    p.block_id,
    p.lesson_id,
    p.chapter_id,
    'deleted'::text as change_type,
    p.content_version as old_version,
    0 as new_version
  from published_blocks p
  left join draft_blocks d on p.block_id = d.block_id
  where d.block_id is null;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.detect_changed_blocks(uuid, uuid) to authenticated;

-- Add comment for documentation
comment on function public.detect_changed_blocks(uuid, uuid) is
  'Compares draft course blocks with published course blocks to detect changes. Returns blocks that are new, modified, or deleted based on content_version comparison.';
