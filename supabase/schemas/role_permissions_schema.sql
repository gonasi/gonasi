-- Maps roles to permissions
create table if not exists public.role_permissions (
  id uuid primary key default uuid_generate_v4() not null,
  role app_role not null,
  permission app_permission not null,
  unique (role, permission)
);

comment on table public.role_permissions is 'Defines which permissions are granted to each application role.';