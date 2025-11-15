import type { TypedSupabaseClient } from '../client';

interface FetchOrgTierLimitsParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export const fetchOrgTierLimits = async ({
  supabase,
  organizationId,
}: FetchOrgTierLimitsParams) => {
  const { data, error } = await supabase
    .from('organization_subscriptions')
    .select(
      `
      tier_limits!organization_subscriptions_tier_fkey (*)
    `,
    )
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('[fetchOrgTierLimits] Error:', error);
    return null;
  }

  return data?.tier_limits ?? null;
};
