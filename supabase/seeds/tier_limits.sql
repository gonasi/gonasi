insert into public.tier_limits (
  tier,
  max_departments_per_org,
  storage_limit_mb_per_org,
  max_members_per_org,
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

-- Launch (Free / Freemium) - Pre-launch generous tier for onboarding schools and solo educators
('launch',
  3,                      -- max_departments_per_org (allow basic team/org structure)
  1000,                   -- storage_limit_mb_per_org (1 GB - enough for interactive content)
  3,                      -- max_members_per_org (small school team)
  10,                     -- max_collaborators_per_course (encourage teamwork)
  3,                      -- max_free_courses_per_org (enough to test and showcase)
  100,                    -- max_students_per_course (enough for initial cohorts)
  true,                   -- ai_tools_enabled (test engagement tools)
  100,                    -- ai_usage_limit_monthly (limited but useful)
  false,                  -- custom_domains_enabled
  null,                   -- max_custom_domains
  'basic',                -- analytics_level
  'community',            -- support_level
  15.00,                  -- platform_fee_percentage (15% platform cut)
  false                   -- white_label_enabled
),

-- Scale (Growth / $49/mo) - Ideal for small to medium institutions
('scale',
  15,                     -- max_departments_per_org (multi-department schools/orgs)
  5000,                   -- storage_limit_mb_per_org (5 GB)
  10,                     -- max_members_per_org (enough for departmental control)
  25,                     -- max_collaborators_per_course (rich course creation teams)
  10,                     -- max_free_courses_per_org (support generous freemium model)
  1000,                   -- max_students_per_course (supports full school term)
  true,                   -- ai_tools_enabled
  1000,                   -- ai_usage_limit_monthly
  true,                   -- custom_domains_enabled
  2,                      -- max_custom_domains
  'intermediate',         -- analytics_level
  'email',                -- support_level
  12.00,                  -- platform_fee_percentage (3% reduction incentive)
  false                   -- white_label_enabled
),

-- Impact (Pro / $129/mo) - Ideal for private institutions, edtech startups, or creators scaling up
('impact',
  50,                     -- max_departments_per_org
  25000,                  -- storage_limit_mb_per_org (25 GB for videos/media)
  25,                     -- max_members_per_org
  60,                     -- max_collaborators_per_course
  25,                     -- max_free_courses_per_org
  10000,                  -- max_students_per_course
  true,                   -- ai_tools_enabled
  5000,                   -- ai_usage_limit_monthly
  true,                   -- custom_domains_enabled
  10,                     -- max_custom_domains
  'advanced',             -- analytics_level
  'priority',             -- support_level
  10.00,                  -- platform_fee_percentage (lower cut to support scale)
  true                    -- white_label_enabled
),

-- Enterprise (Custom / $499+/mo) - Universities, government programs, large publishers
('enterprise',
  9999,                   -- max_departments_per_org (unlimited)
  100000,                 -- storage_limit_mb_per_org (100 GB)
  999,                    -- max_members_per_org
  999,                    -- max_collaborators_per_course
  999,                    -- max_free_courses_per_org
  999999,                 -- max_students_per_course
  true,                   -- ai_tools_enabled
  null,                   -- ai_usage_limit_monthly (unlimited)
  true,                   -- custom_domains_enabled
  999,                    -- max_custom_domains (unlimited)
  'enterprise',           -- analytics_level
  'dedicated',            -- support_level
  8.00,                   -- platform_fee_percentage (lowest cut to incentivize large clients)
  true                    -- white_label_enabled
);
