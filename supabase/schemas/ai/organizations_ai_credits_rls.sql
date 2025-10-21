-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------

alter table public.organizations_ai_credits enable row level security;

-- SELECT: allow organization members to view their org's credit balance
create policy "Allow organization members to view organizations_ai_credits"
on public.organizations_ai_credits
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations_ai_credits.org_id
      and om.user_id = (select auth.uid())
  )
  or (
    select owned_by from public.organizations o
    where o.id = organizations_ai_credits.org_id
  ) = (select auth.uid())
);

-- Restrict INSERT / UPDATE / DELETE for regular users
create policy "Restrict organizations_ai_credits insert to service role"
on public.organizations_ai_credits
for insert
to authenticated
with check (false);

create policy "Restrict organizations_ai_credits update to service role"
on public.organizations_ai_credits
for update
to authenticated
using (false)
with check (false);

create policy "Restrict organizations_ai_credits delete to service role"
on public.organizations_ai_credits
for delete
to authenticated
using (false);
