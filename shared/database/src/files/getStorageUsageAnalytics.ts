import type { TypedSupabaseClient } from '../client';

export interface CourseStorageUsage {
  courseId: string;
  courseName: string;
  courseImageUrl: string;
  courseBlurHash: string;
  usageMB: number;
  usageBytes: number;
  fileCount: number;
  largestFile?: {
    name: string;
    sizeMB: number;
    mimeType: string;
  };
}

export interface StorageUsageResponse {
  success: boolean;
  message?: string;
  data?: {
    organizationId: string;
    totalUsageMB: number;
    totalUsageBytes: number;
    limitMB: number;
    limitBytes: number;
    remainingMB: number;
    remainingBytes: number;
    usagePercentage: number;
    totalFiles: number;
    courseBreakdown: CourseStorageUsage[];
  };
}

/**
 * Get detailed storage usage analytics for an organization
 */
export const getStorageUsageAnalytics = async (
  supabase: TypedSupabaseClient,
  organizationId: string,
): Promise<StorageUsageResponse> => {
  try {
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
      return { success: false, message: 'Unable to fetch organization storage limits' };
    }

    const storageLimitMB = orgData.tier_limits.storage_limit_mb_per_org;
    const storageLimitBytes = storageLimitMB * 1024 * 1024;

    // Get detailed file usage with course information
    const { data: fileData, error: fileError } = await supabase
      .from('file_library')
      .select(
        `
        id,
        name,
        size,
        mime_type,
        course_id,
        courses!inner(
          id,
          name,
          image_url,
          blur_hash
        )
      `,
      )
      .eq('organization_id', organizationId);

    if (fileError) {
      console.error('Error fetching file data:', fileError);
      return { success: false, message: 'Unable to fetch file usage data' };
    }

    // Calculate total usage
    const totalUsageBytes = fileData?.reduce((total, file) => total + (file.size || 0), 0) || 0;
    const totalUsageMB = Math.round((totalUsageBytes / (1024 * 1024)) * 100) / 100;
    const totalFiles = fileData?.length || 0;

    // Group files by course and calculate usage per course
    const courseMap = new Map<string, CourseStorageUsage>();

    fileData?.forEach((file) => {
      const courseId = file.course_id;
      const courseName = file.courses.name;
      const courseImageUrl = file.courses.image_url;
      const courseBlurHash = file.courses.blur_hash;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseName,
          courseImageUrl: courseImageUrl ?? '',
          courseBlurHash: courseBlurHash ?? '',
          usageMB: 0,
          usageBytes: 0,
          fileCount: 0,
        });
      }

      const courseUsage = courseMap.get(courseId)!;
      courseUsage.usageBytes += file.size || 0;
      courseUsage.usageMB = Math.round((courseUsage.usageBytes / (1024 * 1024)) * 100) / 100;
      courseUsage.fileCount += 1;

      // Track largest file in each course
      const fileSizeMB = Math.round(((file.size || 0) / (1024 * 1024)) * 100) / 100;
      if (!courseUsage.largestFile || fileSizeMB > courseUsage.largestFile.sizeMB) {
        courseUsage.largestFile = {
          name: file.name,
          sizeMB: fileSizeMB,
          mimeType: file.mime_type,
        };
      }
    });

    // Convert map to array and sort by usage (descending)
    const courseBreakdown = Array.from(courseMap.values()).sort(
      (a, b) => b.usageBytes - a.usageBytes,
    );

    // Calculate remaining storage
    const remainingBytes = storageLimitBytes - totalUsageBytes;
    const remainingMB = Math.round((remainingBytes / (1024 * 1024)) * 100) / 100;
    const usagePercentage = Math.round((totalUsageBytes / storageLimitBytes) * 10000) / 100; // 2 decimal places

    return {
      success: true,
      data: {
        organizationId,
        totalUsageMB,
        totalUsageBytes,
        limitMB: storageLimitMB,
        limitBytes: storageLimitBytes,
        remainingMB,
        remainingBytes,
        usagePercentage,
        totalFiles,
        courseBreakdown,
      },
    };
  } catch (error) {
    console.error('Unexpected error getting storage usage analytics:', error);
    return { success: false, message: 'Unable to retrieve storage usage analytics' };
  }
};
