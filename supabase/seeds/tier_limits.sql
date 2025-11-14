-- ===================================================
-- Sample tier configurations (optimized for early growth and profitability)
-- Includes pricing: price_monthly_usd and price_yearly_usd
-- ===================================================
insert into tier_limits (
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

-- Launch (Free) - Generous onboarding to build user base and showcase platform
('launch',
  500,
  3,
  2,
  true,
  200,
  false,
  null,
  'basic',
  'community',
  15.00,
  false,
  0.00,     -- Monthly price
  0.00      -- Yearly price
),

-- Scale ($39/mo or $390/yr with 2 months free)
('scale',
  10000,
  15,
  15,
  true,
  2000,
  true,
  3,
  'intermediate',
  'email',
  12.00,
  false,
  39.00,     -- Monthly price
  390.00     -- Yearly price (equivalent to $32.50/mo)
),

-- Impact ($99/mo or $990/yr with 2 months free)
('impact',
  50000,
  50,
  50,
  true,
  10000,
  true,
  10,
  'advanced',
  'priority',
  9.00,
  true,
  99.00,     -- Monthly price
  990.00     -- Yearly price (equivalent to $82.50/mo)
),

-- Enterprise ($299/mo or $2990/yr with 2 months free)
('enterprise',
  200000,
  200,
  200,
  true,
  null,
  true,
  50,
  'enterprise',
  'dedicated',
  7.00,
  true,
  299.00,    -- Monthly price
  2990.00    -- Yearly price (equivalent to ~$249.17/mo)
);
