-- ====================================================================================
-- TRIGGER FUNCTION: Automatically add creator as course editor
-- If the creating user has the 'editor' org role, auto-register them in course_editors.
-- Prevents manual self-addition and keeps collaborative permissions consistent.
-- ====================================================================================
create or replace function public.add_creator_as_course_editor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_user uuid := (select auth.uid()); -- Authenticated user performing the insert
begin
  -- Fetch user's role within the course's organization
  select public.get_user_org_role(NEW.organization_id, v_user)
    into v_role;

  -- Only auto-add if user is an editor
  if v_role = 'editor' then
    insert into public.course_editors (course_id, profile_id, added_by)
    values (NEW.id, v_user, v_user)
    on conflict (course_id, profile_id) do nothing;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Auto-add creator as editor after course creation
-- ====================================================================================
create trigger trg_add_creator_as_course_editor
after insert on public.courses
for each row
execute function public.add_creator_as_course_editor();
