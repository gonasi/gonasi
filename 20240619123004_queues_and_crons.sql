-- Create PGMQ queue
select pgmq.create('delete_course_progress_queue');
select pgmq.create('user_notifications_email_queue');


select cron.schedule(
  'process-delete-course-progress',
  '*/1 * * * *',
  $$ select process_delete_course_progress(); $$
);

select cron.schedule(
  'daily-ai-credit-reset',
  '0 0 * * *',  -- every day at midnight UTC
  $$ select public.reset_org_ai_base_credits_when_due(); $$
);

-- ============================================================================
-- CRON: user-notifications-email-dispatch
-- ============================================================================
-- PURPOSE:
--   Invokes the Edge Function responsible for processing user notification
--   emails (dequeueing from PGMQ, sending emails, handling retries, etc).
--
--   This cron ONLY triggers the Edge Function. All processing happens in the
--   function itself.
--
-- SCHEDULE:
--   Every 2 minutes (adjust as needed)
-- ============================================================================
select cron.schedule(
  'invoke-user-notifications-email-dispatch',
  '*/1 * * * *',  -- every 2 minutes
  $$
    with secrets as (
      select
        max(case when name = 'project_url' then decrypted_secret end) as project_url,
        max(case when name = 'publishable_key' then decrypted_secret end) as publishable_key
      from vault.decrypted_secrets
      where name in ('project_url', 'publishable_key')
    )
    select
      net.http_post(
        url := secrets.project_url || '/functions/v1/user-notifications-email-dispatch',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || secrets.publishable_key
        ),
        body := jsonb_build_object('triggered_at', now())
      ) as request_id
    from secrets;
  $$
);
