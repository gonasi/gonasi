-- ============================================================================================
-- FUNCTION: update_progress_cascade_on_block_change
-- TRIGGER FUNCTION
--
-- DESCRIPTION:
--   This trigger function is invoked whenever a row in the `block_progress` table is inserted
--   or updated. It ensures that progress data remains consistent across related tables by 
--   triggering updates to both lesson-level and course-level progress based on changes in 
--   block completion status.
--
-- BEHAVIOR:
--   - On INSERT of a new block_progress row, or
--   - On UPDATE where `is_completed` has changed,
--     => Triggers helper functions to recalculate:
--        - lesson_progress (via update_lesson_progress_for_user)
--        - course_progress (via update_course_progress_for_user)
--
-- DEPENDENCIES:
--   - public.update_lesson_progress_for_user(uuid, uuid, uuid)
--   - public.update_course_progress_for_user(uuid, uuid)
--
-- SECURITY:
--   - Executes with INVOKER rights
--   - Uses an empty search_path for safety
-- ============================================================================================

create or replace function public.update_progress_cascade_on_block_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Process only if:
  -- 1. A new progress row is being inserted, or
  -- 2. The completion status of an existing progress row has changed
  if tg_op = 'INSERT'
     or (tg_op = 'UPDATE' and old.is_completed is distinct from new.is_completed) then

    -- Update lesson progress for the affected lesson
    perform public.update_lesson_progress_for_user(
      new.user_id,             -- user whose progress changed
      new.published_course_id, -- the related published course
      new.lesson_id            -- the lesson containing the block
    );

    -- Update course-level progress for the same user and course
    perform public.update_course_progress_for_user(
      new.user_id,             -- same user
      new.published_course_id  -- same course
    );
  end if;

  -- Return the new row (for INSERT/UPDATE), or old row if no new available
  return coalesce(new, old);
end;
$$;
