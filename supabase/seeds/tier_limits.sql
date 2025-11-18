-- ===================================================
-- Tier seed data (commented for clarity & dev debugging)
-- ===================================================
insert into public.tier_limits (
  tier,
  storage_limit_mb_per_org,
  max_members_per_org,
  max_free_courses_per_org,
  ai_tools_enabled,
  ai_usage_limit_monthly,
  custom_domains_enabled,
  max_custom_domains,
  analytics_level,
  support_level,
  platform_fee_percentage,
  white_label_enabled,
  price_monthly_usd,
  price_yearly_usd
) values

-- ===================================================
-- TEMP TIER (extra placeholder orgs, blocked until upgraded)
-- ===================================================
('temp',
  0,            -- storage_limit_mb_per_org
  1,            -- max_members_per_org
  0,            -- max_free_courses_per_org
  false,        -- ai_tools_enabled
  0,            -- ai_usage_limit_monthly
  false,        -- custom_domains_enabled
  0,            -- max_custom_domains
  'none',       -- analytics_level
  'none',       -- support_level
  0,            -- platform_fee_percentage
  false,        -- white_label_enabled
  0.00,         -- price_monthly_usd
  0.00          -- price_yearly_usd
),

-- ===================================================
-- LAUNCH (free plan)
-- ===================================================
('launch',
  500,          -- storage_limit_mb_per_org
  3,            -- max_members_per_org
  2,            -- max_free_courses_per_org
  true,         -- ai_tools_enabled
  200,          -- ai_usage_limit_monthly
  false,        -- custom_domains_enabled
  0,            -- max_custom_domains
  'basic',      -- analytics_level
  'community',  -- support_level
  20.00,        -- platform_fee_percentage
  false,        -- white_label_enabled
  0.00,         -- price_monthly_usd
  0.00          -- price_yearly_usd
),

-- ===================================================
-- SCALE (starter paid tier)
-- ===================================================
('scale',
  20480,        -- storage_limit_mb_per_org (20GB)
  15,           -- max_members_per_org
  25,           -- max_free_courses_per_org
  true,         -- ai_tools_enabled
  5000,         -- ai_usage_limit_monthly
  true,         -- custom_domains_enabled
  2,            -- max_custom_domains
  'intermediate', -- analytics_level
  'email',      -- support_level
  10.00,        -- platform_fee_percentage
  false,        -- white_label_enabled
  39.00,        -- price_monthly_usd
  390.00        -- price_yearly_usd
),

-- ===================================================
-- IMPACT (advanced tier for schools/orgs with revenue)
-- ===================================================
('impact',
  102400,       -- storage_limit_mb_per_org (100GB)
  60,           -- max_members_per_org
  200,          -- max_free_courses_per_org
  true,         -- ai_tools_enabled
  50000,        -- ai_usage_limit_monthly
  true,         -- custom_domains_enabled
  5,            -- max_custom_domains
  'advanced',   -- analytics_level
  'priority',   -- support_level
  5.00,         -- platform_fee_percentage
  true,         -- white_label_enabled
  99.00,        -- price_monthly_usd
  990.00        -- price_yearly_usd
);
