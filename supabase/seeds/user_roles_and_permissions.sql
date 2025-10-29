-- ================================================
-- ROLE PERMISSIONS DATA
-- ================================================
insert into public.role_permissions (role, permission)
values
  -- Super User ('go_su') has full control over all categories, subcategories, and featured pathways
  ('go_su', 'course_categories.insert'),  
  ('go_su', 'course_categories.update'),  
  ('go_su', 'course_categories.delete'),  
  ('go_su', 'course_sub_categories.insert'),  
  ('go_su', 'course_sub_categories.update'),  
  ('go_su', 'course_sub_categories.delete'), 
  ('go_su', 'featured_courses_pricing.insert'),  
  ('go_su', 'featured_courses_pricing.update'),  
  ('go_su', 'featured_courses_pricing.delete'),   
  ('go_su', 'lesson_types.insert'),  
  ('go_su', 'lesson_types.update'),  
  ('go_su', 'lesson_types.delete'),  
  ('go_su', 'pricing_tier.crud'),  
  ('go_su', 'go_wallet.view'),  
  ('go_su', 'go_wallet.withdraw'),  

  -- Super User CRUD meta permissions
  ('go_su', 'go_su_create'),
  ('go_su', 'go_su_read'),
  ('go_su', 'go_su_update'),
  ('go_su', 'go_su_delete'),

  -- Admin ('go_admin') has the same permissions as Super User but is intended for high-level management
  ('go_admin', 'course_categories.insert'),  
  ('go_admin', 'course_categories.update'),  
  ('go_admin', 'course_categories.delete'),  
  ('go_admin', 'course_sub_categories.insert'),  
  ('go_admin', 'course_sub_categories.update'),  
  ('go_admin', 'course_sub_categories.delete'),    
  ('go_admin', 'featured_courses_pricing.insert'),  
  ('go_admin', 'featured_courses_pricing.update'),  
  ('go_admin', 'featured_courses_pricing.delete'), 
  ('go_admin', 'lesson_types.insert'),  
  ('go_admin', 'lesson_types.update'),  
  ('go_admin', 'lesson_types.delete'), 
  ('go_admin', 'go_wallet.view'),

  -- Admin CRUD meta permissions
  ('go_admin', 'go_admin_create'),
  ('go_admin', 'go_admin_read'),
  ('go_admin', 'go_admin_update'),
  ('go_admin', 'go_admin_delete'),

  -- Staff ('go_staff') has permissions to manage courses and feature courses but no pricing control
  ('go_staff', 'course_categories.insert'),  
  ('go_staff', 'course_categories.update'),  
  ('go_staff', 'course_categories.delete'),  
  ('go_staff', 'course_sub_categories.insert'),  
  ('go_staff', 'course_sub_categories.update'),  
  ('go_staff', 'course_sub_categories.delete'),

  -- Staff CRUD meta permissions
  ('go_staff', 'go_staff_create'),
  ('go_staff', 'go_staff_read'),
  ('go_staff', 'go_staff_update'),
  ('go_staff', 'go_staff_delete');
