import type { TypedSupabaseClient } from '../../client';

interface FetchOrganizationTierParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export const fetchOrganizationTierName = async ({
  supabase,
  organizationId,
}: FetchOrganizationTierParams) => {
  const { data, error } = await supabase.rpc('get_org_tier', {
    p_org: organizationId,
  });

  if (error) {
    console.error('[fetchOrganizationTierName] Error:', error);
    return null;
  }

  // data is the tier string or null
  return data ?? null;
};
