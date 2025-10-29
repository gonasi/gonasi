-- Defines all application permission types.
create type public.app_permission as enum (
  'course_categories.insert',
  'course_categories.update',
  'course_categories.delete',
  'course_sub_categories.insert',
  'course_sub_categories.update',
  'course_sub_categories.delete',
  'featured_courses_pricing.insert',
  'featured_courses_pricing.update',
  'featured_courses_pricing.delete',
  'lesson_types.insert',
  'lesson_types.update',
  'lesson_types.delete',
  'pricing_tier.crud',
  'go_wallet.view',
  'go_wallet.withdraw',
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
