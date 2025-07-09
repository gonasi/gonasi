import type { TypedSupabaseClient } from '../client';
import type { CourseStorageUsage } from './getStorageUsageAnalytics';

/**
 * Get storage usage for a specific course
 */
export const getCourseStorageUsage = async (
  supabase: TypedSupabaseClient,
  courseId: string,
  organizationId: string,
): Promise<{
  success: boolean;
  message?: string;
  data?: CourseStorageUsage;
}> => {
  try {
    // Get course info and files
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, name, image_url, blur_hash')
      .eq('id', courseId)
      .eq('organization_id', organizationId)
      .single();

    if (courseError) {
      console.error('Error fetching course data:', courseError);
      return { success: false, message: 'Course not found' };
    }

    const { data: fileData, error: fileError } = await supabase
      .from('file_library')
      .select('id, name, size, mime_type')
      .eq('course_id', courseId)
      .eq('organization_id', organizationId);

    if (fileError) {
      console.error('Error fetching file data:', fileError);
      return { success: false, message: 'Unable to fetch course file data' };
    }

    const usageBytes = fileData?.reduce((total, file) => total + (file.size || 0), 0) || 0;
    const usageMB = Math.round((usageBytes / (1024 * 1024)) * 100) / 100;
    const fileCount = fileData?.length || 0;

    // Find largest file
    let largestFile: CourseStorageUsage['largestFile'];
    if (fileData && fileData.length > 0) {
      const largest = fileData.reduce((prev, current) =>
        (current.size || 0) > (prev.size || 0) ? current : prev,
      );
      largestFile = {
        name: largest.name,
        sizeMB: Math.round(((largest.size || 0) / (1024 * 1024)) * 100) / 100,
        mimeType: largest.mime_type,
      };
    }

    return {
      success: true,
      data: {
        courseId,
        courseName: courseData.name,
        courseImageUrl: courseData.image_url ?? '',
        courseBlurHash: courseData.blur_hash ?? '',
        usageMB,
        usageBytes,
        fileCount,
        largestFile,
      },
    };
  } catch (error) {
    console.error('Unexpected error getting course storage usage:', error);
    return { success: false, message: 'Unable to retrieve course storage usage' };
  }
};
