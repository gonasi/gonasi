-- Insert role-based permissions
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

  -- Staff ('go_staff') has permissions to manage courses and feature courses but no pricing control
  ('go_staff', 'course_categories.insert'),  
  ('go_staff', 'course_categories.update'),  
  ('go_staff', 'course_categories.delete'),  
  ('go_staff', 'course_sub_categories.insert'),  
  ('go_staff', 'course_sub_categories.update'),  
  ('go_staff', 'course_sub_categories.delete');

-- Insert default pricing tiers for featured courses
insert into public.featured_courses_pricing (id, feature_package, description, daily_rate, created_at, updated_at) values
  -- Basic Package: Low-cost, standard visibility placement
  (uuid_generate_v4(), 'basic', 'Standard featuring with limited visibility.', 1000.00, timezone('utc', now()), timezone('utc', now())),

  -- Enhanced Package: Higher visibility with priority placement
  (uuid_generate_v4(), 'enhanced', 'Increased visibility with priority placement.', 2500.00, timezone('utc', now()), timezone('utc', now())),

  -- Exclusive Package: Premium placement with highlights and top-tier exposure
  (uuid_generate_v4(), 'exclusive', 'Premium featuring with top placement and highlights.', 5000.00, timezone('utc', now()), timezone('utc', now()));
