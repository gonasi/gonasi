import type { TypedSupabaseClient } from '../client';
import { THUMBNAILS_BUCKET } from '../constants';
import { fetchOrganizationTierLimits } from '../organizations';

export interface CourseStorageUsage {
  courseId: string;
  courseName: string;
  courseImageUrl: string;
  courseBlurHash: string;
  signedUrl?: string | null;
  usageMB: number;
  usageBytes: number;
  fileCount: number;
  unpublishedUsageBytes: number;
  publishedUsageBytes: number;
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
    unpublishedUsageBytes: number;
    publishedUsageBytes: number;
    limitMB: number;
    limitBytes: number;
    remainingMB: number;
    remainingBytes: number;
    usagePercentage: number;
    totalFiles: number;
    status: 'success' | 'warning' | 'error';
    courseBreakdown: CourseStorageUsage[];
  };
}

/**
 * Get detailed storage usage analytics for an organization
 * Calculates usage from both file_library (unpublished) and published_file_library
 */
export const getStorageUsageAnalytics = async (
  supabase: TypedSupabaseClient,
  organizationId: string,
): Promise<StorageUsageResponse> => {
  try {
    const tierLimits = await fetchOrganizationTierLimits({
      supabase,
      organizationId,
    });

    if (!tierLimits) {
      console.error('No tier limits');
      return { success: false, message: 'Unable to fetch organization storage limits' };
    }

    const storageLimitMB = tierLimits.storage_limit_mb_per_org;
    const storageLimitBytes = storageLimitMB * 1024 * 1024;

    /**
     * Fetch unpublished files (file_library)
     */
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
      console.error('Error fetching unpublished file data:', fileError);
      return { success: false, message: 'Unable to fetch unpublished file usage data' };
    }

    /**
     * Fetch published files (published_file_library)
     */
    const { data: publishedFileData, error: publishedFileError } = await supabase
      .from('published_file_library')
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

    if (publishedFileError) {
      console.error('Error fetching published file data:', publishedFileError);
      return { success: false, message: 'Unable to fetch published file usage data' };
    }

    // Calculate totals
    const unpublishedBytes = fileData?.reduce((total, file) => total + (file.size || 0), 0) || 0;
    const publishedBytes =
      publishedFileData?.reduce((total, file) => total + (file.size || 0), 0) || 0;
    const totalUsageBytes = unpublishedBytes + publishedBytes;
    const totalUsageMB = Math.round((totalUsageBytes / (1024 * 1024)) * 100) / 100;
    const totalFiles = (fileData?.length || 0) + (publishedFileData?.length || 0);

    // Group files by course and calculate usage per course
    const courseMap = new Map<string, CourseStorageUsage>();

    // Process unpublished files
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
          unpublishedUsageBytes: 0,
          publishedUsageBytes: 0,
          fileCount: 0,
        });
      }

      const courseUsage = courseMap.get(courseId)!;
      const fileSize = file.size || 0;
      courseUsage.unpublishedUsageBytes += fileSize;
      courseUsage.usageBytes += fileSize;
      courseUsage.fileCount += 1;

      // Track largest file
      const fileSizeMB = Math.round(((fileSize / (1024 * 1024)) * 100) / 100);
      if (!courseUsage.largestFile || fileSizeMB > courseUsage.largestFile.sizeMB) {
        courseUsage.largestFile = {
          name: file.name,
          sizeMB: fileSizeMB,
          mimeType: file.mime_type,
        };
      }
    });

    // Process published files
    publishedFileData?.forEach((file) => {
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
          unpublishedUsageBytes: 0,
          publishedUsageBytes: 0,
          fileCount: 0,
        });
      }

      const courseUsage = courseMap.get(courseId)!;
      const fileSize = file.size || 0;
      courseUsage.publishedUsageBytes += fileSize;
      courseUsage.usageBytes += fileSize;
      courseUsage.fileCount += 1;

      // Track largest file
      const fileSizeMB = Math.round(((fileSize / (1024 * 1024)) * 100) / 100);
      if (!courseUsage.largestFile || fileSizeMB > courseUsage.largestFile.sizeMB) {
        courseUsage.largestFile = {
          name: file.name,
          sizeMB: fileSizeMB,
          mimeType: file.mime_type,
        };
      }
    });

    // Update usageMB for all courses
    courseMap.forEach((course) => {
      course.usageMB = Math.round((course.usageBytes / (1024 * 1024)) * 100) / 100;
    });

    // Convert map to array and sort by usage (descending)
    const courseBreakdown = Array.from(courseMap.values()).sort(
      (a, b) => b.usageBytes - a.usageBytes,
    );

    // Add signed URLs for course images
    const courseBreakdownWithSignedUrls = await Promise.all(
      courseBreakdown.map(async (course) => {
        if (!course.courseImageUrl) {
          return { ...course, signedUrl: null };
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(THUMBNAILS_BUCKET)
          .createSignedUrl(course.courseImageUrl, 3600);

        if (signedUrlError) {
          console.error(
            `Failed to create signed URL for ${course.courseImageUrl}:`,
            signedUrlError.message,
          );
        }

        return {
          ...course,
          signedUrl: signedUrlData?.signedUrl || null,
        };
      }),
    );

    // Calculate remaining storage and status
    const remainingBytes = storageLimitBytes - totalUsageBytes;
    const remainingMB = Math.round((remainingBytes / (1024 * 1024)) * 100) / 100;
    const usagePercentage = Math.round((totalUsageBytes / storageLimitBytes) * 10000) / 100;

    let status: 'success' | 'warning' | 'error' = 'success';
    if (totalUsageBytes > storageLimitBytes) {
      status = 'error';
    } else if (usagePercentage >= 80) {
      status = 'warning';
    }

    return {
      success: true,
      data: {
        organizationId,
        totalUsageMB,
        totalUsageBytes,
        unpublishedUsageBytes: unpublishedBytes,
        publishedUsageBytes: publishedBytes,
        limitMB: storageLimitMB,
        limitBytes: storageLimitBytes,
        remainingMB,
        remainingBytes,
        usagePercentage,
        totalFiles,
        status,
        courseBreakdown: courseBreakdownWithSignedUrls,
      },
    };
  } catch (error) {
    console.error('Unexpected error getting storage usage analytics:', error);
    return { success: false, message: 'Unable to retrieve storage usage analytics' };
  }
};
