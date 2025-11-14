-- ============================================================================
-- REALTIME AUTHORIZATION: Organization Notifications Broadcast
-- ============================================================================
-- This allows members to receive real-time notifications based on their role
-- Channel topic format: 'org-notifications:{organization_id}'
-- ============================================================================

-- Policy: Allow authenticated users to RECEIVE broadcasts on org notification channels
-- if they're a member of that organization with proper role visibility
-- Policy: Allow users to RECEIVE broadcasts on their org notification channels
create policy "org_notifications_broadcast_receive"
on "realtime"."messages"
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.user_id = (select auth.uid())
      and (select realtime.topic()) = 'org-notifications:' || om.organization_id::text
      and realtime.messages.extension in ('broadcast')
  )
);

-- Policy: Allow users to SEND broadcasts on their org notification channels
create policy "org_notifications_broadcast_send"
on "realtime"."messages"
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organization_members om
    where om.user_id = (select auth.uid())
      and (select realtime.topic()) = 'org-notifications:' || om.organization_id::text
      and realtime.messages.extension in ('broadcast')
  )
);