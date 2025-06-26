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
  'pricing_tier.crud'
);

-- Defines application-level roles.
create type public.app_role as enum (
  'go_su',
  'go_admin',
  'go_staff',
  'user'
);
