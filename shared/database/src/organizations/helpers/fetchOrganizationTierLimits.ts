import type { TypedSupabaseClient } from '../../client';

interface FetchOrganizationTierParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export const fetchOrganizationTierLimits = async ({
  supabase,
  organizationId,
}: FetchOrganizationTierParams) => {
  const { data, error } = await supabase.rpc('get_tier_limits', {
    p_org: organizationId,
  });

  if (error) {
    console.error('[fetchOrganizationTierLimits] Error:', error);
    return null;
  }

  // data is the tier string or null
  return data ?? null;
};
