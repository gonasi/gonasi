import type { TypedSupabaseClient } from '../client';
import { THUMBNAILS_BUCKET } from '../constants';

interface FetchCourseOverviewArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

/**
 * Fetches a single course overview by its ID, including:
 * - Basic metadata (name, description, timestamps)
 * - Category & subcategory info
 * - Creator and last updater profile
 * - Signed image URL (if image is set)
 *
 * @param {TypedSupabaseClient} supabase - Supabase client instance
 * @param {string} courseId - The course ID to fetch
 * @returns {Promise<object | null>} Course overview with signed image URL or null on error
 */
export async function fetchOrganizationCourseOverviewById({
  supabase,
  courseId,
}: FetchCourseOverviewArgs) {
  // Fetch the course details with joins for category and user profiles
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      organization_id,
      name,
      visibility,
      description,
      image_url,
      blur_hash,
      created_at,
      updated_at,
      created_by,
      updated_by,
      course_categories(id, name),
      course_sub_categories(id, name),
      created_by_profile:profiles!courses_created_by_fkey (
        id, username, email, full_name, avatar_url
      ),
      updated_by_profile:profiles!courses_updated_by_fkey (
        id, username, email, full_name, avatar_url
      )
    `,
    )
    .eq('id', courseId)
    .single();

  if (error || !data) {
    console.error('Error fetching course:', error?.message || 'Course not found');
    return null;
  }

  // If no image URL is set, return the course data without a signed URL
  if (!data.image_url) {
    return {
      ...data,
      signedUrl: '',
    };
  }

  // Generate a signed URL for the course thumbnail (valid for 1 hour)
  const { data: signedUrlData } = await supabase.storage
    .from(THUMBNAILS_BUCKET)
    .createSignedUrl(data.image_url, 3600);

  return {
    ...data,
    signedUrl: signedUrlData?.signedUrl || '',
  };
}
