import type { TypedSupabaseClient } from '@gonasi/database/client';

interface FetchTotalCoursesStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

type OrganizationWalletBalancesResult = Awaited<ReturnType<typeof fetchOrganizationWalletBalances>>;

export type { OrganizationWalletBalancesResult };

export async function fetchOrganizationWalletBalances({
  supabase,
  organizationId,
}: FetchTotalCoursesStatsArgs) {
  const { data, error } = await supabase.rpc('get_organization_earnings_summary', {
    p_org_id: organizationId,
  });

  console.log('data: ', data);
  console.log('error: ', error);
  if (error || !data) {
    return {
      success: false,
      message: 'Could not fetch',
      data: null,
    } as const;
  }
  return {
    success: true,
    message: 'Successfully fetched ',
    data,
  } as const;
}
