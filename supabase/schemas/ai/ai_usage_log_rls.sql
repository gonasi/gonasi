-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------

alter table public.ai_usage_log enable row level security;

-- SELECT: allow organization members to view logs for their organization
create policy "Allow org members to view ai_usage_log"
on public.ai_usage_log
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = ai_usage_log.org_id
      and om.user_id = (select auth.uid())
  )
  or (
    select owned_by from public.organizations o
    where o.id = ai_usage_log.org_id
  ) = (select auth.uid())
);

-- Restrict INSERT / UPDATE / DELETE for regular users
create policy "Restrict ai_usage_log modifications to service role (insert)"
on public.ai_usage_log
for insert
to authenticated
with check (false);

create policy "Restrict ai_usage_log modifications to service role (update)"
on public.ai_usage_log
for update
to authenticated
using (false)
with check (false);

create policy "Restrict ai_usage_log modifications to service role (delete)"
on public.ai_usage_log
for delete
to authenticated
using (false);
