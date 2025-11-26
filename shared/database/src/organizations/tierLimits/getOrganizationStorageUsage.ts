/**
 * ---------------------------------------------------------------------------
 *  STORAGE USAGE CALCULATOR
 * ---------------------------------------------------------------------------
 *
 *  This utility calculates total storage usage for an organization across:
 *    - file_library
 *    - published_file_library
 *
 *  It returns a comprehensive, strongly-typed breakdown including:
 *    - total allowed storage
 *    - used storage
 *    - remaining storage
 *    - percentage used
 *    - warning/exceeded flags
 *    - a status indicator: `success`, `warning`, `error`
 *
 *  Status Logic:
 *    - "error"   → usage has exceeded the allowed limit
 *    - "warning" → usage is >= 80% of the allowed limit
 *    - "success" → usage is safely within limit (< 80%)
 *
 *  Expected Usage:
 *    const result = await getOrganizationStorageUsage(
 *      supabase,
 *      organizationId,
 *      plan.storage_limit_bytes,
 *    );
 *
 *  This is typically consumed inside higher-level limit summaries.
 * ---------------------------------------------------------------------------
 */

import type { TypedSupabaseClient } from '../../client';
import type { TierStatus } from './tierLimitsTypes';

/**
 * Breakdown of storage usage per internal storage table.
 */
export interface StorageBreakdown {
  /** Bytes used in file_library */
  fileLibraryBytes: number;

  /** Bytes used in published_file_library */
  publishedFileLibraryBytes: number;
}

/**
 * Comprehensive storage usage result.
 */
export interface StorageUsageResult {
  /** Maximum allowed storage (bytes) based on organization tier */
  allowed_bytes: number;

  /** Total bytes used across both tables */
  used_bytes: number;

  /** Remaining available bytes before hitting limit */
  remaining_bytes: number;

  /** Percentage of allowed storage that has been consumed */
  percentage_used: number;

  /** True when usage is >= 80% but not exceeded */
  approaching_limit: boolean;

  /** True when usage exceeds allowed limit */
  exceeded_limit: boolean;

  /** "success", "warning", or "error" status */
  status: TierStatus;

  /** Detailed table-level breakdown */
  breakdown: StorageBreakdown;
}

export interface StorageUsageOptions {
  supabase: TypedSupabaseClient;
  organizationId: string;
  /** Allowed storage in MB, as stored in the database */
  allowedStorageMB: number;
}

export const getOrganizationStorageUsage = async ({
  supabase,
  organizationId,
  allowedStorageMB,
}: StorageUsageOptions): Promise<StorageUsageResult> => {
  const allowedStorageBytes = allowedStorageMB * 1024 * 1024; // convert MB → bytes

  /**
   * -----------------------------------------------------------------------
   * 1. Fetch bytes from file_library
   * -----------------------------------------------------------------------
   */
  const { data: fileLibraryData, error: fileLibraryError } = await supabase
    .from('file_library')
    .select('size')
    .eq('organization_id', organizationId);

  if (fileLibraryError) {
    throw new Error(`file_library query failed: ${fileLibraryError.message}`);
  }

  /**
   * -----------------------------------------------------------------------
   * 2. Fetch bytes from published_file_library
   * -----------------------------------------------------------------------
   */
  const { data: publishedFileData, error: publishedFileError } = await supabase
    .from('published_file_library')
    .select('size')
    .eq('organization_id', organizationId);

  if (publishedFileError) {
    throw new Error(`published_file_library query failed: ${publishedFileError.message}`);
  }

  /**
   * -----------------------------------------------------------------------
   * 3. Sum raw byte usage from each source table
   * -----------------------------------------------------------------------
   */
  const fileLibraryBytes = fileLibraryData.reduce((acc, f) => acc + f.size, 0);
  const publishedFileLibraryBytes = publishedFileData.reduce((acc, f) => acc + f.size, 0);

  const usedBytes = fileLibraryBytes + publishedFileLibraryBytes;

  /**
   * Percent used relative to allowed bytes.
   * If allowed is 0, we avoid division by zero and treat as 0% used.
   */
  const percentageUsed =
    allowedStorageBytes === 0 ? 0 : Number(((usedBytes / allowedStorageBytes) * 100).toFixed(2));

  /**
   * Limit status flags based on usage thresholds.
   */
  const exceededLimit = usedBytes > allowedStorageBytes;
  const approachingLimit = !exceededLimit && percentageUsed >= 80;

  /**
   * Derive status string.
   */
  let status: TierStatus = 'success';
  if (exceededLimit) status = 'error';
  else if (approachingLimit) status = 'warning';

  /**
   * -----------------------------------------------------------------------
   * 4. Return complete usage object
   * -----------------------------------------------------------------------
   */
  return {
    allowed_bytes: allowedStorageBytes,
    used_bytes: usedBytes,
    remaining_bytes: Math.max(allowedStorageBytes - usedBytes, 0),
    percentage_used: percentageUsed,
    approaching_limit: approachingLimit,
    exceeded_limit: exceededLimit,
    status,
    breakdown: {
      fileLibraryBytes,
      publishedFileLibraryBytes,
    },
  };
};
