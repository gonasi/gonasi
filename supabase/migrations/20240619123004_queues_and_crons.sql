-- Create PGMQ queue
select pgmq.create('delete_course_progress_queue');

select cron.schedule(
  'process-delete-course-progress',
  '*/2 * * * *',
  $$ select process_delete_course_progress(); $$
);