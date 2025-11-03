-- Defines all application permission types.
create type public.app_permission as enum (
  -- Superuser permissions
  'go_su_create',
  'go_su_read',
  'go_su_update',
  'go_su_delete',

  -- Admin permissions
  'go_admin_create',
  'go_admin_read',
  'go_admin_update',
  'go_admin_delete',

  -- Staff permissions
  'go_staff_create',
  'go_staff_read',
  'go_staff_update',
  'go_staff_delete'
);

-- Defines application-level roles.
create type public.app_role as enum (
  'go_su',
  'go_admin',
  'go_staff',
  'user'
);
