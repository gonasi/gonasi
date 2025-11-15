import type { TypedSupabaseClient } from '../client';

interface GetOrgStorageUsageArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

interface StorageUsageData {
  current_usage_bytes: number;
  storage_limit_bytes: number;
  remaining_bytes: number;
  percent_used: number;
  exceeded: boolean;
}

interface StorageUsageResponse {
  success: boolean;
  message: string;
  data: StorageUsageData | null;
}

export const getOrgStorageUsage = async ({
  supabase,
  organizationId,
}: GetOrgStorageUsageArgs): Promise<StorageUsageResponse> => {
  if (!organizationId) {
    return { success: false, message: 'Invalid organization ID', data: null };
  }

  const { data, error } = await supabase.rpc('get_org_storage_usage', {
    p_org_id: organizationId,
  });

  if (error) {
    console.error('RPC error fetching org storage usage:', error);
    return { success: false, message: 'Unable to fetch storage usage', data: null };
  }

  if (!data || typeof data !== 'object') {
    return { success: false, message: 'Malformed or empty response from RPC', data: null };
  }

  // First cast to unknown to satisfy TypeScript
  const response = data as unknown as StorageUsageResponse;

  // Ensure data always exists (RPC may return error object inside data)
  if (!response.success && response.data && (response.data as any).error) {
    return { success: false, message: (response.data as any).error, data: response.data };
  }

  return {
    success: Boolean(response.success),
    message: response.message ?? (response.success ? 'OK' : 'Unknown error'),
    data: response.data ?? null,
  };
};
