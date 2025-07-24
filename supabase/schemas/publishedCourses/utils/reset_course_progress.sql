-- ====================================================================================
-- FUNCTION: reset_course_progress
-- PURPOSE: Deletes all user progress data for a specific published course
-- SECURITY: Runs as definer with restricted search_path
-- ====================================================================================
create or replace function public.reset_course_progress(
  course_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Delete all progress records for this course
  -- Order matters due to potential foreign key constraints
  
  -- Delete block progress (most granular level)
  delete from public.block_progress 
  where published_course_id = course_id;
  
  -- Delete lesson progress
  delete from public.lesson_progress 
  where published_course_id = course_id;
  
  -- Delete chapter progress
  delete from public.chapter_progress 
  where published_course_id = course_id;
  
  -- Delete course progress
  delete from public.course_progress 
  where published_course_id = course_id;
  
  -- Delete lesson reset counts
  delete from public.lesson_reset_count 
  where published_course_id = course_id;
  
  -- Log the reset action (optional - you might want to track this)
  raise notice 'Reset all progress for course: %', course_id;
end;
$$;