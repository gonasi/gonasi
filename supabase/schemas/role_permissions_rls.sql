alter table public.role_permissions enable row level security;

-- Public read access (for authorization functions)
create policy "role_permissions_select_policy" 
  on public.role_permissions
  as permissive for select
  to authenticated
  using (true);

-- Only 'go_su' can insert permissions
create policy "role_permissions_insert_policy" 
  on public.role_permissions
  as permissive for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid()) 
      and ur.role = 'go_su'
    )
  );

-- Only 'go_su' can update permissions
create policy "role_permissions_update_policy" 
  on public.role_permissions
  as permissive for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid()) 
      and ur.role = 'go_su'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid()) 
      and ur.role = 'go_su'
    )
  );

-- Only 'go_su' can delete permissions
create policy "role_permissions_delete_policy" 
  on public.role_permissions
  as permissive for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur 
      where ur.user_id = (select auth.uid()) 
      and ur.role = 'go_su'
    )
  );
