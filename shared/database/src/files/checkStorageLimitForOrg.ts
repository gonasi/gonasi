import type { TypedSupabaseClient } from '../client';

interface CheckStorageLimitArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
  newFileSize: number;
  excludeFileId?: string;
}

interface StorageLimitData {
  file_size: number;
  remaining_bytes: number | null;
}

interface StorageLimitResponse {
  success: boolean;
  message: string;
  data: StorageLimitData | null;
}

export const checkStorageLimitForOrg = async ({
  supabase,
  organizationId,
  newFileSize,
  excludeFileId,
}: CheckStorageLimitArgs): Promise<StorageLimitResponse> => {
  try {
    if (!organizationId || newFileSize <= 0) {
      return {
        success: false,
        message: 'Invalid organization ID or file size',
        data: null,
      };
    }

    const { data, error } = await supabase.rpc('check_storage_limit_for_org', {
      p_org_id: organizationId,
      p_new_file_size: newFileSize,
      p_exclude_file_id: excludeFileId,
    });

    if (error) {
      console.error('RPC error checking storage limit:', error);
      return { success: false, message: 'Unable to check storage limit', data: null };
    }

    if (!data) {
      return { success: false, message: 'No response from server', data: null };
    }

    // Cast safely via unknown
    const result = data as unknown as StorageLimitResponse;

    return result;
  } catch (err) {
    console.error('Unexpected error checking storage limit:', err);
    return { success: false, message: 'Unable to verify storage limits', data: null };
  }
};
