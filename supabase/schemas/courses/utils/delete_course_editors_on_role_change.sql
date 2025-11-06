-- =========================================
-- FUNCTION: delete_course_editors_on_role_change
-- =========================================
create or replace function public.delete_course_editors_on_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only act if the role changed from 'editor' to something else
  if old.role = 'editor' and new.role <> 'editor' then
    delete from public.course_editors
    using public.courses c
    where course_editors.user_id = old.user_id
      and course_editors.course_id = c.id
      and c.organization_id = old.organization_id;
  end if;

  return new;
end;
$$;

-- =========================================
-- TRIGGER: after_update_role_on_org_members
-- =========================================
create trigger after_update_role_on_org_members
after update of role
on public.organization_members
for each row
execute function public.delete_course_editors_on_role_change();
