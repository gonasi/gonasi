import type { TypedSupabaseClient } from '../client';

// ---------------------------------------------
// Function params
// ---------------------------------------------
interface FetchOrganizationSubscriptionStatusParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

// ---------------------------------------------
// Fetch organization subscription + tier limits
// ---------------------------------------------
export const fetchOrganizationSubscriptionStatus = async ({
  supabase,
  organizationId,
}: FetchOrganizationSubscriptionStatusParams) => {
  // Step 1: resolve organization by handle
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .maybeSingle();

  if (orgError || !org) {
    console.log('error: ', orgError);
    return {
      success: false,
      message: 'Organization not found',
      data: null,
    };
  }

  // Step 2: get organization subscription and its tier limits
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
        tier_limits (
          tier,
          max_organizations_per_user,
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
        )
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
    return {
      success: false,
      message: 'No subscription found for this organization',
      data: null,
    };
  }

  // Step 3: format and return
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
    },
  };
};

// ---------------------------------------------
// Infer the return type of the function
// ---------------------------------------------
export type FetchOrganizationSubscriptionStatusResponse = Awaited<
  ReturnType<typeof fetchOrganizationSubscriptionStatus>
>;
