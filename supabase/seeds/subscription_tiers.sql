insert into public.tier_limits (
  id,
  max_departments_per_org,
  storage_limit_mb_per_org,
  max_admins_per_org,
  max_collaborators_per_course,
  max_free_courses_per_org,
  max_students_per_course,
  ai_tools_enabled,
  ai_usage_limit_monthly,
  custom_domains_enabled,
  max_custom_domains,
  analytics_level,
  support_level,
  platform_fee_percentage,
  white_label_enabled
) values
-- Launch (Free / Freemium) - Generous pre-launch tier for adoption
('launch',
  2,                      -- max_departments_per_org (allow some structure)
  500,                    -- storage_limit_mb_per_org (500 MB for interactive content)
  2,                      -- max_admins_per_org (allow small teams)
  5,                      -- max_collaborators_per_course (functional collaboration)
  2,                      -- max_free_courses_per_org (enough to test properly)
  50,                     -- max_students_per_course (classroom-sized)
  true,                   -- ai_tools_enabled (pre-launch feature access)
  25,                     -- ai_usage_limit_monthly (limited but functional)
  false,                  -- custom_domains_enabled
  null,                   -- max_custom_domains
  'basic',                -- analytics_level
  'community',            -- support_level
  20.00,                  -- platform_fee_percentage (reduced for early adoption)
  false                   -- white_label_enabled
),

-- Scale (Growth / $49/mo) - Clear upgrade path with substantial improvements
('scale',
  10,                     -- max_departments_per_org (5x increase)
  2500,                   -- storage_limit_mb_per_org (50x increase)
  8,                      -- max_admins_per_org (4x increase)
  20,                     -- max_collaborators_per_course (4x increase)
  25,                     -- max_free_courses_per_org (8x increase)
  500,                    -- max_students_per_course (10x increase)
  true,                   -- ai_tools_enabled
  500,                    -- ai_usage_limit_monthly (20x increase)
  true,                   -- custom_domains_enabled
  3,                      -- max_custom_domains
  'intermediate',         -- analytics_level
  'email',                -- support_level
  15.00,                  -- platform_fee_percentage (5% reduction)
  false                   -- white_label_enabled
),

-- Impact (Pro / $129/mo) - Professional tier with enterprise-like features
('impact',
  25,                     -- max_departments_per_org (12.5x from free)
  20000,                  -- storage_limit_mb_per_org (400x increase)
  20,                     -- max_admins_per_org (10x increase)
  50,                     -- max_collaborators_per_course (10x increase)
  100,                    -- max_free_courses_per_org (33x increase)
  2500,                   -- max_students_per_course (50x increase)
  true,                   -- ai_tools_enabled
  5000,                   -- ai_usage_limit_monthly (200x increase)
  true,                   -- custom_domains_enabled
  15,                     -- max_custom_domains (5x from Scale)
  'advanced',             -- analytics_level
  'priority',             -- support_level
  12.00,                  -- platform_fee_percentage (8% reduction from free)
  true                    -- white_label_enabled
),

-- Enterprise (Custom / $500+/mo) - Maximum profit margins
('enterprise',
  9999,                   -- max_departments_per_org (unlimited)
  200000,                 -- storage_limit_mb_per_org (doubled)
  999,                    -- max_admins_per_org (unlimited)
  999,                    -- max_collaborators_per_course (unlimited)
  999,                    -- max_free_courses_per_org (unlimited)
  999999,                 -- max_students_per_course (unlimited)
  true,                   -- ai_tools_enabled
  null,                   -- ai_usage_limit_monthly (unlimited)
  true,                   -- custom_domains_enabled
  999,                    -- max_custom_domains (unlimited)
  'enterprise',           -- analytics_level
  'dedicated',            -- support_level
  12.00,                  -- platform_fee_percentage (increased from 8%)
  true                    -- white_label_enabled
);