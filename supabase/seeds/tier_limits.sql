-- ===================================================
-- Sample tier configurations (optimized for early growth and profitability)
-- Includes pricing: price_monthly_usd and price_yearly_usd
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

-- TEMP TIER (extra organizations before upgrade)
('temp',
  50,         -- minimal storage
  1,          -- owner only
  1,
  false,      -- no AI
  0,
  false,
  0,
  'none',     -- no analytics
  'none',     -- no support
  15.00,
  false,
  0.00,
  0.00
),

-- LAUNCH TIER (only allowed 1 per owner)
('launch',
  1024,       -- 1GB
  3,
  3,
  true,
  200,
  false,
  0,
  'basic',
  'community',
  15.00,
  false,
  0.00,
  0.00
),

-- SCALE TIER (starter paid)
('scale',
  10240,      -- 10GB
  10,
  10,
  true,
  2000,
  true,
  1,
  'intermediate',
  'email',
  10.00,
  false,
  19.00,
  190.00
),

-- IMPACT TIER (growing orgs)
('impact',
  51200,      -- 50GB
  25,
  50,
  true,
  10000,
  true,
  3,
  'advanced',
  'priority',
  7.50,
  true,
  49.00,
  490.00
);