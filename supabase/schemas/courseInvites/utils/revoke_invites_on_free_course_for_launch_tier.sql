-- ===================================================
-- FUNCTION: revoke_invites_on_free_course_for_launch_tier
-- ===================================================
-- Purpose: Automatically revoke pending course invites when a
--          paid course becomes free for launch tier organizations
--
-- Trigger: Fires on UPDATE of published_courses.has_free_tier
-- ===================================================

create or replace function public.revoke_invites_on_free_course_for_launch_tier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_tier public.subscription_tier;
  revoked_count int;
begin
  -- Only proceed if has_free_tier changed from false to true
  if OLD.has_free_tier = false and NEW.has_free_tier = true then

    -- Get the organization's tier
    org_tier := public.get_org_tier(NEW.organization_id);

    -- Only revoke invites for launch tier organizations
    if org_tier = 'launch' then

      -- Revoke all pending invites for this course
      update public.course_invites
      set
        revoked_at = now(),
        updated_at = now()
      where published_course_id = NEW.id
        and accepted_at is null
        and revoked_at is null
        and expires_at > now();

      get diagnostics revoked_count = row_count;

      -- Log the action for debugging (optional, can be removed)
      raise notice 'Course % (org: %) became free on launch tier. Revoked % pending invites.',
        NEW.id, NEW.organization_id, revoked_count;

    end if;
  end if;

  return NEW;
end;
$$;

-- ===================================================
-- TRIGGER: trg_revoke_invites_on_free_course
-- ===================================================
-- Fires after UPDATE on published_courses to check if
-- pricing changed and revoke invites if necessary
-- ===================================================

create trigger trg_revoke_invites_on_free_course
  after update on public.published_courses
  for each row
  when (OLD.has_free_tier is distinct from NEW.has_free_tier)
  execute function public.revoke_invites_on_free_course_for_launch_tier();
