import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations/getUserOrgRole';
import type { Database } from '../schema';

interface FetchOrganizationSubscriptionStatusParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

// Extract base types from Supabase schema
type OrganizationSubscriptionRow =
  Database['public']['Tables']['organization_subscriptions']['Row'];
type TierLimitsRow = Database['public']['Tables']['tier_limits']['Row'];

// Define success and error response types
export interface OrganizationSubscriptionSuccessResponse {
  success: true;
  message: string;
  data: {
    subscription: OrganizationSubscriptionRow;
    tier: TierLimitsRow;
    allTiers: TierLimitsRow[];
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  data: null;
}

export const fetchOrganizationSubscriptionStatus = async ({
  supabase,
  organizationId,
}: FetchOrganizationSubscriptionStatusParams): Promise<
  OrganizationSubscriptionSuccessResponse | ErrorResponse
> => {
  const role = await getUserOrgRole({ supabase, organizationId });

  if (!role || role === 'editor') {
    return {
      success: false,
      message: 'You do not have permission to view this content.',
      data: null,
    };
  }

  // Fetch organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .maybeSingle();

  if (orgError || !org) {
    console.error('Organization fetch error:', orgError);
    return { success: false, message: 'Organization not found', data: null };
  }

  // Fetch subscription with tier limits
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
        created_at,
        updated_at,
        created_by,
        updated_by,
        tier_limits (*)
      `,
    )
    .eq('organization_id', org.id)
    .maybeSingle();

  if (subError) {
    return {
      success: false,
      message: `Failed to fetch subscription: ${subError.message}`,
      data: null,
    };
  }

  if (!subscription) {
    return { success: false, message: 'No subscription found for this organization', data: null };
  }

  // Fetch all tiers
  const { data: allTiers, error: allTiersErr } = await supabase.from('tier_limits').select('*');
  if (allTiersErr || !allTiers?.length) {
    return {
      success: false,
      message: `Failed to fetch all tiers: ${allTiersErr?.message}`,
      data: null,
    };
  }

  return {
    success: true,
    message: 'Organization subscription fetched successfully',
    data: {
      subscription: {
        id: subscription.id,
        organization_id: subscription.organization_id,
        tier: subscription.tier,
        status: subscription.status,
        start_date: subscription.start_date,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        created_by: subscription.created_by,
        updated_by: subscription.updated_by,
      },
      tier: subscription.tier_limits,
      allTiers,
    },
  };
};

// Export response types
export type FetchOrganizationSubscriptionStatusResponse =
  | OrganizationSubscriptionSuccessResponse
  | ErrorResponse;

// Happy path type
export type FetchOrganizationSubscriptionStatusSuccess = OrganizationSubscriptionSuccessResponse;

// Convenience exports
export type OrganizationSubscription =
  OrganizationSubscriptionSuccessResponse['data']['subscription'];
export type OrganizationTier = OrganizationSubscriptionSuccessResponse['data']['tier'];
export type AllTiers = OrganizationSubscriptionSuccessResponse['data']['allTiers'];
