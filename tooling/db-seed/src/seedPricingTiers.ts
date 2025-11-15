import { faker } from '@snaplet/copycat';

import { PASSWORD, SU_EMAIL, supabase } from './constants';
import { SIGNED_UP_EMAILS } from './signUpUsers';
import { tierLimitsLocal } from './tierLimitsLocal';

type Tier = 'temp' | 'launch' | 'scale' | 'impact';

type AnalyticsLevel = 'none' | 'basic' | 'intermediate' | 'advanced';
type SupportLevel = 'none' | 'community' | 'email' | 'priority';

export interface TierLimitSeed {
  tier: Tier;
  storage_limit_mb_per_org: number;
  max_members_per_org: number;
  max_free_courses_per_org: number;
  ai_tools_enabled: boolean;
  ai_usage_limit_monthly: number | null;
  custom_domains_enabled: boolean;
  max_custom_domains: number | null;
  analytics_level: AnalyticsLevel;
  support_level: SupportLevel;
  platform_fee_percentage: number;
  white_label_enabled: boolean;
  price_monthly_usd: number;
  price_yearly_usd: number;
}

export const tierLimits: TierLimitSeed[] = [
  //
  // TEMP — placeholder tier for additional org creation
  //
  {
    tier: 'temp',
    storage_limit_mb_per_org: 0,
    max_members_per_org: 0,
    max_free_courses_per_org: 0,
    ai_tools_enabled: false,
    ai_usage_limit_monthly: null,
    custom_domains_enabled: false,
    max_custom_domains: null,
    analytics_level: 'none',
    support_level: 'none',
    platform_fee_percentage: 0.0,
    white_label_enabled: false,
    price_monthly_usd: 0.0,
    price_yearly_usd: 0.0,
  },

  //
  // LAUNCH — free tier (1 per owner)
  //
  {
    tier: 'launch',
    storage_limit_mb_per_org: 500,
    max_members_per_org: 3,
    max_free_courses_per_org: 2,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 200,
    custom_domains_enabled: false,
    max_custom_domains: null,
    analytics_level: 'basic',
    support_level: 'community',
    platform_fee_percentage: 20.0,
    white_label_enabled: false,
    price_monthly_usd: 0.0,
    price_yearly_usd: 0.0,
  },

  //
  // SCALE — main mid-tier
  //
  {
    tier: 'scale',
    storage_limit_mb_per_org: 10000,
    max_members_per_org: 15,
    max_free_courses_per_org: 15,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 2000,
    custom_domains_enabled: true,
    max_custom_domains: 3,
    analytics_level: 'intermediate',
    support_level: 'email',
    platform_fee_percentage: 12.0,
    white_label_enabled: false,
    price_monthly_usd: 39.0,
    price_yearly_usd: 390.0,
  },

  //
  // IMPACT — advanced tier
  //
  {
    tier: 'impact',
    storage_limit_mb_per_org: 50000,
    max_members_per_org: 50,
    max_free_courses_per_org: 50,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 10000,
    custom_domains_enabled: true,
    max_custom_domains: 10,
    analytics_level: 'advanced',
    support_level: 'priority',
    platform_fee_percentage: 9.0,
    white_label_enabled: true,
    price_monthly_usd: 99.0,
    price_yearly_usd: 990.0,
  },
];

export async function seedPricingTiers() {
  const admins = SIGNED_UP_EMAILS.filter((email) => email === SU_EMAIL);

  const adminEmail = faker.helpers.arrayElement(admins);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: PASSWORD,
  });

  if (signInError) {
    console.log(`❌ Failed to sign in as ${adminEmail}`);
  }

  for (const tier of tierLimitsLocal) {
    const { error } = await supabase.from('tier_limits').insert(tier);

    if (error) {
      console.error(`❌ Failed to insert tier "${tier.tier}":`, error.message);
    } else {
      console.log(`✅ Inserted pricing tier: ${tier.tier}`);
    }
  }
}
