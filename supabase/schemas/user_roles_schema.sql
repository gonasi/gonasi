-- Stores roles assigned to users
create table public.user_roles (
  id uuid primary key default uuid_generate_v4() not null,
  user_id uuid not null references public.profiles on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
comment on table public.user_roles is 'Stores one or more application roles for each user.';

create index idx_user_roles_user_id on public.user_roles(user_id);