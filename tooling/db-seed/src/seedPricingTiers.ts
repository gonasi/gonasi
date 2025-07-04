import { faker } from '@snaplet/copycat';

import { PASSWORD, SU_EMAIL, supabase } from './constants';
import { SIGNED_UP_EMAILS } from './signUpUsers';

type Tier = 'launch' | 'scale' | 'impact' | 'enterprise';
type AnalyticsLevel = 'basic' | 'intermediate' | 'advanced' | 'enterprise';
type SupportLevel = 'community' | 'email' | 'priority' | 'dedicated';

interface TierLimitSeed {
  tier: Tier;
  max_departments_per_org: number;
  storage_limit_mb_per_org: number;
  max_members_per_org: number;
  max_collaborators_per_course: number;
  max_free_courses_per_org: number;
  max_students_per_course: number;
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
    max_departments_per_org: 3,
    storage_limit_mb_per_org: 1000,
    max_members_per_org: 3,
    max_collaborators_per_course: 10,
    max_free_courses_per_org: 3,
    max_students_per_course: 100,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 100,
    custom_domains_enabled: false,
    max_custom_domains: null,
    analytics_level: 'basic',
    support_level: 'community',
    platform_fee_percentage: 15.0,
    white_label_enabled: false,
  },
  {
    tier: 'scale',
    max_departments_per_org: 15,
    storage_limit_mb_per_org: 5000,
    max_members_per_org: 10,
    max_collaborators_per_course: 25,
    max_free_courses_per_org: 10,
    max_students_per_course: 1000,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 1000,
    custom_domains_enabled: true,
    max_custom_domains: 2,
    analytics_level: 'intermediate',
    support_level: 'email',
    platform_fee_percentage: 12.0,
    white_label_enabled: false,
  },
  {
    tier: 'impact',
    max_departments_per_org: 50,
    storage_limit_mb_per_org: 25000,
    max_members_per_org: 25,
    max_collaborators_per_course: 60,
    max_free_courses_per_org: 25,
    max_students_per_course: 10000,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: 5000,
    custom_domains_enabled: true,
    max_custom_domains: 10,
    analytics_level: 'advanced',
    support_level: 'priority',
    platform_fee_percentage: 10.0,
    white_label_enabled: true,
  },
  {
    tier: 'enterprise',
    max_departments_per_org: 9999,
    storage_limit_mb_per_org: 100000,
    max_members_per_org: 999,
    max_collaborators_per_course: 999,
    max_free_courses_per_org: 999,
    max_students_per_course: 999999,
    ai_tools_enabled: true,
    ai_usage_limit_monthly: null,
    custom_domains_enabled: true,
    max_custom_domains: 999,
    analytics_level: 'enterprise',
    support_level: 'dedicated',
    platform_fee_percentage: 8.0,
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
