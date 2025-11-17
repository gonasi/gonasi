import type { TierLimitSeed } from './seedPricingTiers';

export const tierLimitsLocal: TierLimitSeed[] = [
  //
  // TEMP — local testing
  //
  {
    tier: 'temp',
    storage_limit_mb_per_org: 0,
    max_members_per_org: 1,
    max_free_courses_per_org: 0,
    ai_tools_enabled: false,
    ai_usage_limit_monthly: 0,
    custom_domains_enabled: false,
    max_custom_domains: 0,
    analytics_level: 'none',
    support_level: 'none',
    platform_fee_percentage: 0.0,
    white_label_enabled: false,
    price_monthly_usd: 0.0,
    price_yearly_usd: 0.0,
    plan_interval: 'hourly',
  },

  //
  // LAUNCH — tiny caps
  //
  {
    tier: 'launch',
    storage_limit_mb_per_org: 5,
    max_members_per_org: 2,
    max_free_courses_per_org: 1,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 20,
    custom_domains_enabled: false,
    max_custom_domains: 0,
    analytics_level: 'basic',
    support_level: 'community',
    platform_fee_percentage: 20.0,
    white_label_enabled: false,
    price_monthly_usd: 0.0,
    price_yearly_usd: 0.0,
    plan_interval: 'hourly',
  },

  //
  // SCALE — tiny but usable
  //
  {
    tier: 'scale',
    storage_limit_mb_per_org: 10,
    max_members_per_org: 3,
    max_free_courses_per_org: 2,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 100,
    custom_domains_enabled: true,
    max_custom_domains: 1,
    analytics_level: 'intermediate',
    support_level: 'email',
    platform_fee_percentage: 12.0,
    white_label_enabled: false,
    price_monthly_usd: 39.0,
    price_yearly_usd: 390.0,
    plan_interval: 'hourly',
  },

  //
  // IMPACT — still mini
  //
  {
    tier: 'impact',
    storage_limit_mb_per_org: 15,
    max_members_per_org: 5,
    max_free_courses_per_org: 3,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 300,
    custom_domains_enabled: true,
    max_custom_domains: 2,
    analytics_level: 'advanced',
    support_level: 'priority',
    platform_fee_percentage: 9.0,
    white_label_enabled: true,
    price_monthly_usd: 99.0,
    price_yearly_usd: 990.0,
    plan_interval: 'hourly',
  },
];
