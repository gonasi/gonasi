import { signInWithEmailAndPassword } from '../../auth';
import { SU_EMAIL, SU_PASSWORD } from '../fixtures/test-data';
import { TestCleanupManager, testSupabase } from '../setup/test-helpers';

type Tier = 'launch' | 'scale' | 'impact' | 'enterprise';
type AnalyticsLevel = 'basic' | 'intermediate' | 'advanced' | 'enterprise';
type SupportLevel = 'community' | 'email' | 'priority' | 'dedicated';

interface TierLimitSeed {
  tier: Tier;
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

export const launchTierLimits: TierLimitSeed = {
  tier: 'launch',
  storage_limit_mb_per_org: 1000,
  max_members_per_org: 2,
  max_collaborators_per_course: 5,
  max_free_courses_per_org: 3,
  max_students_per_course: 50,
  ai_tools_enabled: false,
  ai_usage_limit_monthly: null,
  custom_domains_enabled: false,
  max_custom_domains: null,
  analytics_level: 'basic',
  support_level: 'community',
  platform_fee_percentage: 15.0,
  white_label_enabled: false,
};

export const scaleTierLimits: TierLimitSeed = {
  tier: 'scale',
  storage_limit_mb_per_org: 10000,
  max_members_per_org: 5,
  max_collaborators_per_course: 15,
  max_free_courses_per_org: 5,
  max_students_per_course: 200,
  ai_tools_enabled: true,
  ai_usage_limit_monthly: 1000,
  custom_domains_enabled: true,
  max_custom_domains: 3,
  analytics_level: 'intermediate',
  support_level: 'email',
  platform_fee_percentage: 10.0,
  white_label_enabled: false,
};

export const impactTierLimits: TierLimitSeed = {
  tier: 'impact',
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
};

export const enterpriseTierLimits: TierLimitSeed = {
  tier: 'enterprise',
  storage_limit_mb_per_org: 100000,
  max_members_per_org: 20,
  max_collaborators_per_course: 50,
  max_free_courses_per_org: 10,
  max_students_per_course: 1000,
  ai_tools_enabled: true,
  ai_usage_limit_monthly: null, // Unlimited
  custom_domains_enabled: true,
  max_custom_domains: 10,
  analytics_level: 'enterprise',
  support_level: 'dedicated',
  platform_fee_percentage: 5.0,
  white_label_enabled: true,
};

const tierLimits: TierLimitSeed[] = [
  launchTierLimits,
  scaleTierLimits,
  impactTierLimits,
  enterpriseTierLimits,
];

export async function seedOrganizationPricingTiers() {
  await TestCleanupManager.signOutAllClients();

  const { error: signInError } = await signInWithEmailAndPassword(testSupabase, {
    email: SU_EMAIL,
    password: SU_PASSWORD,
  });

  if (signInError) {
    console.error(`❌ Failed to sign in as ${SU_EMAIL}:`, signInError.message);
    throw new Error('Stopping seed due to sign-in failure.');
  }

  for (const tier of tierLimits) {
    const { error: insertError } = await testSupabase.from('tier_limits').insert(tier);

    if (insertError) {
      console.error(`❌ Failed to insert tier "${tier.tier}":`, insertError.message);
      throw new Error('Stopping seed due to insert failure.');
    }
  }

  await TestCleanupManager.signOutAllClients();
}
