import { THUMBNAILS_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchAssetsParams } from '../types';

interface FetchOrgCoursesParams extends FetchAssetsParams {
  organizationId: string;
}

/**
 * Fetches paginated courses for a given organization.
 * Includes signed URLs for course thumbnails (if present).
 *
 * @param {FetchOrgCoursesParams} params - Options for pagination, search, and organization context.
 * @returns {Promise<{ count: number; data: any[] }>} Paginated list of courses with signed image URLs.
 */
export async function fetchOrganizationCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  organizationId,
}: FetchOrgCoursesParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  // Base query to fetch courses for the given organization
  let query = supabase
    .from('courses')
    .select('id, name, image_url, blur_hash', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex);

  // Optional search query on course name or description
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: courses, error, count } = await query;

  if (error) {
    console.error('Failed to fetch organization courses:', error.message);
    return {
      count: 0,
      data: [],
    };
  }

  if (!courses?.length) {
    return {
      count: 0,
      data: [],
    };
  }

  // Add signed thumbnail URLs if available
  const dataWithSignedUrls = await Promise.all(
    courses.map(async (course) => {
      if (!course.image_url) return { ...course, signed_url: null };

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .createSignedUrl(course.image_url, 3600); // Expires in 1 hour

      if (signedUrlError) {
        console.error(
          `Failed to create signed URL for ${course.image_url}:`,
          signedUrlError.message,
        );
      }

      return {
        ...course,
        signed_url: signedUrlData?.signedUrl || null,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
