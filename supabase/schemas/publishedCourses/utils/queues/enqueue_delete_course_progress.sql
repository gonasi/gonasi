create or replace function enqueue_delete_course_progress(course_id uuid)
returns void
language sql
set search_path = ''
as $$
  select pgmq.send(
    'delete_course_progress_queue',
    jsonb_build_object('course_id', course_id)
  );
$$;
