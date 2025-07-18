-- ====================================================================================
-- RLS Policies for: public.block_progress
-- DESCRIPTION: Controls access to block progress records.
-- ====================================================================================

-- STEP 1: Enable RLS
alter table public.block_progress enable row level security;

-- STEP 2: Authenticated users can SELECT block progress if:
--         - the profile is public, OR
--         - they are in the same organization as the progress owner
create policy "select: auth users can view public or same-org progress"
on public.block_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = block_progress.user_id
      and (
        p.is_public = true
        or exists (
          select 1
          from public.organization_members m1
          join public.organization_members m2
            on m1.organization_id = m2.organization_id
          where m1.user_id = block_progress.user_id
            and m2.user_id = (select auth.uid())
        )
      )
  )
);

-- STEP 3: Authenticated users can INSERT their own block progress
create policy "insert: user can create their own progress"
on public.block_progress
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

-- STEP 4: Authenticated users can UPDATE their own block progress
create policy "update: user can update their own progress"
on public.block_progress
for update
to authenticated
using (
  user_id = (select auth.uid())
);

-- STEP 5: Authenticated users can DELETE their own block progress
create policy "delete: user can delete their own progress"
on public.block_progress
for delete
to authenticated
using (
  user_id = (select auth.uid())
);

-- STEP 6: Anonymous users can SELECT block progress only if the owner's profile is public
create policy "select: anon users can view public progress"
on public.block_progress
for select
to anon
using (
  exists (
    select 1
    from public.profiles p
    where p.id = block_progress.user_id
      and p.is_public = true
  )
);
