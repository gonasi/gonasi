-- ================================================
-- ROLE PERMISSIONS DATA
-- ================================================
insert into public.role_permissions (role, permission)
values
  -- go_su: Full system access
  ('go_su', 'profiles.delete'),
  ('go_su', 'profiles.manage_all'),
  ('go_su', 'users.manage'),
  ('go_su', 'roles.assign'),
  ('go_su', 'system.admin'),
  ('go_su', 'content.moderate'),
  
  -- go_admin: Administrative access but not system-level
  ('go_admin', 'profiles.manage_all'),
  ('go_admin', 'users.manage'),
  ('go_admin', 'content.moderate'),
  
  -- go_staff: Staff-level permissions
  ('go_staff', 'content.moderate');