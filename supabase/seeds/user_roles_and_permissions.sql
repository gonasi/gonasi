-- ================================================
-- ROLE PERMISSIONS DATA
-- ================================================
insert into public.role_permissions (role, permission)
values 
  -- Super User CRUD meta permissions
  ('go_su', 'go_su_create'),
  ('go_su', 'go_su_read'),
  ('go_su', 'go_su_update'),
  ('go_su', 'go_su_delete'),

  -- Admin CRUD meta permissions
  ('go_admin', 'go_admin_create'),
  ('go_admin', 'go_admin_read'),
  ('go_admin', 'go_admin_update'),
  ('go_admin', 'go_admin_delete'),

  -- Staff CRUD meta permissions
  ('go_staff', 'go_staff_create'),
  ('go_staff', 'go_staff_read'),
  ('go_staff', 'go_staff_update'),
  ('go_staff', 'go_staff_delete');
