-- ====================================================================================
-- TRIGGER FUNCTION: Automatically add creator as session facilitator
-- If the creating user has the 'editor' org role, auto-register them in live_session_facilitators.
-- Prevents manual self-addition and keeps collaborative permissions consistent.
-- ====================================================================================
create or replace function public.add_creator_as_facilitator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_user uuid := (select auth.uid()); -- Authenticated user performing the insert
begin
  -- Fetch user's role within the session's organization
  select public.get_user_org_role(NEW.organization_id, v_user)
    into v_role;

  -- Only auto-add if user is an editor (staff)
  if v_role = 'editor' then
    insert into public.live_session_facilitators (live_session_id, user_id, organization_id, added_by)
    values (NEW.id, v_user, NEW.organization_id, v_user)
    on conflict (live_session_id, user_id) do nothing;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Auto-add creator as facilitator after session creation
-- ====================================================================================
create trigger trg_add_creator_as_facilitator
after insert on public.live_sessions
for each row
execute function public.add_creator_as_facilitator();

comment on function public.add_creator_as_facilitator is 'Auto-adds editor-role users as facilitators when they create a live session';
