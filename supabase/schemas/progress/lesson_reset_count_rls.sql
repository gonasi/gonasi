-- ====================================================================================
-- RLS Policies for: public.lesson_reset_count
-- DESCRIPTION: Controls access to lesson reset records.
--              Users can manage their own records. Admins in the same org can view.
-- ====================================================================================

-- Enable RLS
alter table public.lesson_reset_count enable row level security;

-- Authenticated users can SELECT reset records if:
-- - the profile is public, OR
-- - they are in the same organization as the reset owner
create policy "select: auth users can view public or same-org resets"
on public.lesson_reset_count
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = lesson_reset_count.user_id
      and (
        p.is_public = true
        or exists (
          select 1
          from public.organization_members m1
          join public.organization_members m2
            on m1.organization_id = m2.organization_id
          where m1.user_id = lesson_reset_count.user_id
            and m2.user_id = (select auth.uid())
        )
      )
  )
);

-- Authenticated users can INSERT their own reset records
create policy "insert: user can create their own reset count"
on public.lesson_reset_count
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

-- Authenticated users can UPDATE their own reset records
create policy "update: user can update their own reset count"
on public.lesson_reset_count
for update
to authenticated
using (
  user_id = (select auth.uid())
);

-- Authenticated users can DELETE their own reset records
create policy "delete: user can delete their own reset count"
on public.lesson_reset_count
for delete
to authenticated
using (
  user_id = (select auth.uid())
);

-- Anonymous users can SELECT reset records only if the owner's profile is public
create policy "select: anon users can view public resets"
on public.lesson_reset_count
for select
to anon
using (
  exists (
    select 1
    from public.profiles p
    where p.id = lesson_reset_count.user_id
      and p.is_public = true
  )
);
