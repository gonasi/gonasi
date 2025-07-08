import { faker } from '@snaplet/copycat';

import { PASSWORD, SU_EMAIL, supabase } from './constants';
import { SIGNED_UP_EMAILS } from './signUpUsers';

type Tier = 'launch' | 'scale' | 'impact' | 'enterprise';
type AnalyticsLevel = 'basic' | 'intermediate' | 'advanced' | 'enterprise';
type SupportLevel = 'community' | 'email' | 'priority' | 'dedicated';

interface TierLimitSeed {
  tier: Tier;
  max_organizations_per_user: number;
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
}

const tierLimits: TierLimitSeed[] = [
  {
    tier: 'launch',
    max_organizations_per_user: 2,
    storage_limit_mb_per_org: 500,
    max_members_per_org: 3,
    max_free_courses_per_org: 3,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 200,
    custom_domains_enabled: false,
    max_custom_domains: null,
    analytics_level: 'basic',
    support_level: 'community',
    platform_fee_percentage: 15.0,
    white_label_enabled: false,
  },
  {
    tier: 'scale',
    max_organizations_per_user: 10,
    storage_limit_mb_per_org: 5000,
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
  },
  {
    tier: 'impact',
    max_organizations_per_user: 25,
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
  },
  {
    tier: 'enterprise',
    max_organizations_per_user: 100,
    storage_limit_mb_per_org: 200000,
    max_members_per_org: 200,
    max_free_courses_per_org: 200,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: null,
    custom_domains_enabled: true,
    max_custom_domains: 50,
    analytics_level: 'enterprise',
    support_level: 'dedicated',
    platform_fee_percentage: 7.0,
    white_label_enabled: true,
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

  for (const tier of tierLimits) {
    const { error } = await supabase.from('tier_limits').insert(tier);

    if (error) {
      console.error(`❌ Failed to insert tier "${tier.tier}":`, error.message);
    } else {
      console.log(`✅ Inserted pricing tier: ${tier.tier}`);
    }
  }
}
