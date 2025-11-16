import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations/getUserOrgRole';
import type { Database } from '../schema';

export type TierLimitsRow = Database['public']['Enums']['subscription_tier'];

export const VALID_TIER_ORDER: TierLimitsRow[] = ['temp', 'launch', 'scale', 'impact'];

interface ValidateOrganizationChangeRequestParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: TierLimitsRow;
}

export interface TierChangeWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
}

export type TierLimits = Database['public']['Tables']['tier_limits']['Row'];

// Type for the specific fields we select from organization_subscriptions
export interface OrganizationSubscriptionWithLimits {
  id: string;
  organization_id: string;
  tier: TierLimitsRow;
  status: Database['public']['Tables']['organization_subscriptions']['Row']['status'];
  start_date: string;
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  downgrade_effective_at: string | null;
  next_tier: TierLimitsRow | null;
  created_at: string;
  updated_at: string;
  tier_limits: TierLimits;
  next_tier_limits: TierLimits | null;
}

export interface OrganizationTierChangeRequestSuccessResponse {
  success: true;
  canProceed: boolean;
  currentTier: TierLimitsRow;
  targetTier: TierLimitsRow;
  isUpgrade: boolean;
  isDowngrade: boolean;
  warnings: TierChangeWarning[];
  data: {
    subscription: OrganizationSubscriptionWithLimits;
    currentTierLimits: TierLimits;
    targetTierLimits: TierLimits;
  };
}
interface ErrorResponse {
  success: false;
  message: string;
  data: null;
}

export const validateTierChangeRequest = async ({
  supabase,
  organizationId,
  targetTier,
}: ValidateOrganizationChangeRequestParams): Promise<
  OrganizationTierChangeRequestSuccessResponse | ErrorResponse
> => {
  // -----------------------------------------------------------
  // 1. Permission check
  // -----------------------------------------------------------
  const role = await getUserOrgRole({ supabase, organizationId });
  if (!role || role !== 'owner') {
    return {
      success: false,
      message: 'You do not have permission to manage this organization’s subscription.',
      data: null,
    };
  }

  // -----------------------------------------------------------
  // 2. Fetch subscription with tier_limits
  // -----------------------------------------------------------
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select(
      `
      id,
      organization_id,
      tier,
      status,
      start_date,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      downgrade_effective_at,
      next_tier,
      created_at,
      updated_at,
      tier_limits:tier_limits!organization_subscriptions_tier_fkey ( * ),
      next_tier_limits:tier_limits!organization_subscriptions_next_tier_fkey ( * )
    `,
    )
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (subError) {
    return {
      success: false,
      message: `Failed to fetch subscription: ${subError.message}`,
      data: null,
    };
  }

  if (!subscription) {
    return {
      success: false,
      message: 'No subscription found for this organization.',
      data: null,
    };
  }

  const currentTier = subscription.tier;
  const currentTierLimits = subscription.tier_limits;

  // -----------------------------------------------------------
  // 3. Fetch target tier limits
  // -----------------------------------------------------------
  const { data: targetTierLimits, error: targetErr } = await supabase
    .from('tier_limits')
    .select('*')
    .eq('tier', targetTier)
    .maybeSingle();

  if (targetErr || !targetTierLimits) {
    return {
      success: false,
      message: `Invalid or unavailable target tier: ${targetTier}`,
      data: null,
    };
  }

  // -----------------------------------------------------------
  // 4. Determine upgrade / downgrade
  // -----------------------------------------------------------

  const currentIndex = VALID_TIER_ORDER.indexOf(currentTier);
  const targetIndex = VALID_TIER_ORDER.indexOf(targetTier);

  const isUpgrade = targetIndex > currentIndex;
  const isDowngrade = targetIndex < currentIndex;

  const warnings: TierChangeWarning[] = [];

  // -----------------------------------------------------------
  // 5. Billing status validation
  // -----------------------------------------------------------
  if (subscription.status === 'attention') {
    warnings.push({
      type: 'error',
      message:
        'Your subscription is past due. Please resolve payment issues before changing plans.',
    });
  }

  // -----------------------------------------------------------
  // 6. Validate overages (for downgrades)
  // -----------------------------------------------------------
  if (isDowngrade) {
    // Members
    const { count: rawMemberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const memberCount = rawMemberCount ?? 0;

    if (
      targetTierLimits.max_members_per_org !== null &&
      memberCount > targetTierLimits.max_members_per_org
    ) {
      warnings.push({
        type: 'error',
        message: `Your organization has ${memberCount} members, exceeding the ${targetTierLimits.max_members_per_org} member limit for the ${targetTier} tier.`,
      });
    }

    // Free courses
    const { count: rawFreeCourseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_paid', false);

    const freeCourseCount = rawFreeCourseCount ?? 0;

    if (
      targetTierLimits.max_free_courses_per_org !== null &&
      freeCourseCount > targetTierLimits.max_free_courses_per_org
    ) {
      warnings.push({
        type: 'error',
        message: `You currently have ${freeCourseCount} free courses, exceeding the limit for the ${targetTier} tier.`,
      });
    }

    // Custom domains
    if (!targetTierLimits.custom_domains_enabled) {
      warnings.push({
        type: 'warning',
        message: `Custom domains are not available on the ${targetTier} tier. Existing domains will no longer work.`,
      });
    }

    // AI tools
    if (!targetTierLimits.ai_tools_enabled) {
      warnings.push({
        type: 'warning',
        message: `AI tools are disabled on the ${targetTier} tier. Your team will lose access.`,
      });
    }
  }

  // -----------------------------------------------------------
  // 7. Final "can proceed" flag
  // -----------------------------------------------------------
  const hasBlockingError = warnings.some((w) => w.type === 'error');

  return {
    success: true,
    canProceed: !hasBlockingError,
    currentTier,
    targetTier,
    isUpgrade,
    isDowngrade,
    warnings,
    data: {
      subscription,
      currentTierLimits,
      targetTierLimits,
    },
  };
};
