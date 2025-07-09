import type { TypedSupabaseClient } from '../client';

/**
 * Check if uploading a file would exceed the organization's storage limit
 */
export const checkStorageLimit = async (
  supabase: TypedSupabaseClient,
  organizationId: string,
  newFileSize: number,
  excludeFileId?: string, // For updates, exclude the current file from usage calculation
): Promise<{ success: boolean; message?: string; currentUsage?: number; limit?: number }> => {
  try {
    // Get current storage usage (excluding the file being updated if applicable)
    let query = supabase.from('file_library').select('size').eq('organization_id', organizationId);

    if (excludeFileId) {
      query = query.neq('id', excludeFileId);
    }

    const { data: currentFiles, error: filesError } = await query;

    if (filesError) {
      console.error('Error fetching current files:', filesError);
      return { success: false, message: 'Unable to check storage usage' };
    }

    const currentUsage = currentFiles?.reduce((total, file) => total + (file.size || 0), 0) || 0;

    // Get organization's tier limits
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(
        `
        tier,
        tier_limits!inner(storage_limit_mb_per_org)
      `,
      )
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization data:', orgError);
      return { success: false, message: 'Unable to check storage limits' };
    }

    const storageLimitBytes = orgData.tier_limits.storage_limit_mb_per_org * 1024 * 1024;
    const wouldExceedLimit = currentUsage + newFileSize > storageLimitBytes;

    if (wouldExceedLimit) {
      const currentUsageMB = Math.round((currentUsage / (1024 * 1024)) * 100) / 100;
      const limitMB = orgData.tier_limits.storage_limit_mb_per_org;
      const fileSizeMB = Math.round((newFileSize / (1024 * 1024)) * 100) / 100;

      return {
        success: false,
        message: `Storage limit exceeded. Current usage: ${currentUsageMB}MB, File size: ${fileSizeMB}MB, Limit: ${limitMB}MB`,
        currentUsage: currentUsageMB,
        limit: limitMB,
      };
    }

    return {
      success: true,
      currentUsage: Math.round((currentUsage / (1024 * 1024)) * 100) / 100,
      limit: orgData.tier_limits.storage_limit_mb_per_org,
    };
  } catch (error) {
    console.error('Unexpected error checking storage limit:', error);
    return { success: false, message: 'Unable to verify storage limits' };
  }
};
