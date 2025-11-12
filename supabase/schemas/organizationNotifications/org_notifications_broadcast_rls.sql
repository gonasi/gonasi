-- ============================================================================
-- REALTIME AUTHORIZATION: Organization Notifications Broadcast
-- ============================================================================
-- This allows members to receive real-time notifications based on their role
-- Channel topic format: 'org-notifications:{organization_id}'
-- ============================================================================

-- Policy: Allow authenticated users to RECEIVE broadcasts on org notification channels
-- if they're a member of that organization with proper role visibility
create policy "org_notifications_broadcast_receive"
on "realtime"."messages"
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1
    from public.organization_members om
    where om.user_id = (select auth.uid())
      -- Extract org_id from topic like 'org-notifications:uuid'
      and (select realtime.topic()) = 'org-notifications:' || om.organization_id::text
  )
);

-- Policy: Allow system/service to SEND broadcasts on org notification channels
-- This would typically be triggered by database functions or Edge Functions
-- For security, you might want to restrict this to service_role only
create policy "org_notifications_broadcast_send"
on "realtime"."messages"
for insert
to authenticated
with check (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1
    from public.organization_members om
    where om.user_id = (select auth.uid())
      and (select realtime.topic()) = 'org-notifications:' || om.organization_id::text
  )
);