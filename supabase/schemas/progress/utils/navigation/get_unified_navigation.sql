-- =============================================================================
-- UNIFIED NAVIGATION SYSTEM
-- =============================================================================
-- This function provides a standardized JSONB response representing the 
-- navigation context for any block, lesson, or chapter within a course. 
-- The unified structure ensures consistent frontend rendering and user experience.
-- =============================================================================

create or replace function public.get_unified_navigation(
  p_user_id uuid,
  p_published_course_id uuid,
  p_current_block_id uuid default null,
  p_current_lesson_id uuid default null,
  p_current_chapter_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_structure jsonb;
  current_context record;
  navigation_result jsonb;
begin
  -- =========================================================================
  -- STEP 1: Fetch the course structure from the published_course_structure_content table
  -- =========================================================================
  select course_structure_content
  into course_structure
  from public.published_course_structure_content
  where id = p_published_course_id;

  if course_structure is null then
    return jsonb_build_object('error', 'course structure not found');
  end if;

  -- =========================================================================
  -- STEP 2: Resolve the current navigation context using provided identifiers
  -- This resolves to a record indicating where in the course structure we are.
  -- =========================================================================
  select * 
  into current_context 
  from public.resolve_current_context(
    course_structure,
    p_current_block_id,
    p_current_lesson_id,
    p_current_chapter_id
  );

  if current_context is null then
    return jsonb_build_object('error', 'could not resolve current context');
  end if;

  -- =========================================================================
  -- STEP 3: Build and return the full unified navigation state as JSONB
  -- The structure includes:
  --   - current:    metadata of current position
  --   - previous:   metadata for previous navigable item
  --   - next:       metadata for next navigable item
  --   - continue:   smart resume pointer
  --   - completion: progress and completion indicators
  --   - course_info: static metadata like title, total items, etc.
  -- =========================================================================
  select jsonb_build_object(
    'current', public.get_current_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'previous', public.get_previous_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'next', public.get_next_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'continue', public.get_continue_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'completion', public.get_completion_navigation_state(
      p_user_id,
      p_published_course_id,
      course_structure,
      current_context
    ),
    'course_info', public.get_course_navigation_info(
      p_user_id,
      p_published_course_id,
      course_structure
    )
  )
  into navigation_result;

  return navigation_result;
end;
$$;
 