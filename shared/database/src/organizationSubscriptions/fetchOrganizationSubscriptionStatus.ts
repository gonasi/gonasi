import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations/getUserOrgRole';
import type { Database } from '../schema';

interface FetchOrganizationSubscriptionStatusParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

// Base Supabase types
type TierLimitsRow = Database['public']['Tables']['tier_limits']['Row'];
type OrganizationSubscriptionRow =
  Database['public']['Tables']['organization_subscriptions']['Row'];

export type OrganizationSubscriptionType = OrganizationSubscriptionRow & {
  tier_limits: TierLimitsRow;
  next_tier_limits?: TierLimitsRow | null;
};

// Success + Error response shapes
export interface OrganizationSubscriptionSuccessResponse {
  success: true;
  message: string;
  data: {
    subscription: OrganizationSubscriptionType;
    tier: TierLimitsRow;
    allTiers: TierLimitsRow[];
    canSubToLaunchTier: boolean;
    canSwitchToLaunch: boolean;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  data: null;
}

export type FetchOrganizationSubscriptionStatusResponse =
  | OrganizationSubscriptionSuccessResponse
  | ErrorResponse;

// Convenience exports
export type OrganizationTier = TierLimitsRow;
export type AllTiers = TierLimitsRow[];

export const fetchOrganizationSubscriptionStatus = async ({
  supabase,
  organizationId,
}: FetchOrganizationSubscriptionStatusParams): Promise<FetchOrganizationSubscriptionStatusResponse> => {
  const userId = await getUserId(supabase);

  // 1. Authorization check: only organization owners may access subscription data
  const userRole = await getUserOrgRole({ supabase, organizationId });
  if (!userRole || userRole !== 'owner') {
    return {
      success: false,
      message: 'You do not have permission to view this content.',
      data: null,
    };
  }

  // 2. Determine the current tier for this organization
  const { data: currentTier } = await supabase.rpc('get_org_tier', {
    p_org: organizationId,
  });
  const isCurrentTierLaunch = currentTier === 'launch';

  // 3. Check if user owns another "launch" tier org
  const { count: launchOrgCount, error: launchOrgErr } = await supabase
    .from('organizations')
    .select('id, organization_subscriptions!inner(tier)', { count: 'exact', head: true })
    .neq('id', organizationId)
    .eq('owned_by', userId)
    .eq('organization_subscriptions.tier', 'launch');

  if (launchOrgErr || launchOrgCount === null) {
    console.error('launchOrgErr:', launchOrgErr);
    return {
      success: false,
      message: 'Failed to count user organizations.',
      data: null,
    };
  }
  const userOwnsAnotherLaunchOrg = launchOrgCount > 0;
  const canSubToLaunchTier = isCurrentTierLaunch || !userOwnsAnotherLaunchOrg;

  // 4. Fetch the active organization subscription with tier details
  const { data: subscriptionRecord, error: subscriptionErr } = await supabase
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
    initial_next_payment_date,
    cancel_at_period_end,
    created_at,
    updated_at,
    created_by,
    updated_by,
    downgrade_effective_at,
    downgrade_executed_at,
    downgrade_requested_at,
    downgrade_requested_by,
    next_payment_date,
    next_plan_code,
    next_tier,
    paystack_customer_code,
    paystack_subscription_code,
    revert_tier,
    tier_limits:tier_limits!organization_subscriptions_tier_fkey (*),
    next_tier_limits:tier_limits!organization_subscriptions_next_tier_fkey (*)
  `,
    )
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (subscriptionErr) {
    console.log('[fetchOrganizationSubscriptionStatus] - subscriptionErr: ', subscriptionErr);
    return {
      success: false,
      message: `Failed to fetch subscription: ${subscriptionErr.message}`,
      data: null,
    };
  }

  if (!subscriptionRecord) {
    return {
      success: false,
      message: 'No subscription found for this organization.',
      data: null,
    };
  }

  // 5. Fetch all available tiers (excluding "temp")
  const { data: allTiers, error: allTiersErr } = await supabase
    .from('tier_limits')
    .select('*')
    .neq('tier', 'temp');

  if (allTiersErr || !allTiers?.length) {
    return {
      success: false,
      message: `Failed to fetch all tiers: ${allTiersErr?.message}`,
      data: null,
    };
  }

  const { data: canSwitchToLaunch } = await supabase.rpc('can_switch_to_launch_tier', {
    p_org_id: organizationId,
  });

  // 6. Return clean subscription + tier data
  return {
    success: true,
    message: 'Organization subscription fetched successfully.',
    data: {
      subscription: subscriptionRecord,
      tier: subscriptionRecord.tier_limits,
      allTiers,
      canSubToLaunchTier: !!canSubToLaunchTier,
      canSwitchToLaunch: !!canSwitchToLaunch,
    },
  };
};
