import { PricingSchema } from '@gonasi/schemas/publish';

import { getUserIdFromUsername } from '../auth';
import { THUMBNAILS_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchAssetsParams } from '../types';

interface FetchCoursesByAdmin extends FetchAssetsParams {
  username: string;
}

/**
 * Fetches published courses created by a specific user (admin/author) for their public profile.
 * Supports pagination and search by course name or description.
 */
export async function fetchPublishedCoursesByUser({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  username,
}: FetchCoursesByAdmin) {
  // Get the user ID from their username
  const userId = await getUserIdFromUsername(supabase, username);
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  // Build the base query to fetch published courses
  let query = supabase
    .from('published_courses')
    .select(
      `
      id,
      published_at,
      version,
      name,
      description,
      image_url,
      blur_hash,
      course_categories,
      course_sub_categories,
      pricing_data,
      created_by
      `,
      { count: 'exact' },
    )
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex);

  // Add search filter if applicable
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: courses, error, count } = await query;

  // Handle query error
  if (error) {
    console.error('[fetchPublishedCoursesByUser] Error fetching courses:', error.message);
    return {
      count: count ?? 0,
      data: [],
    };
  }

  // Return empty data if no courses found
  if (!courses?.length) return { count: count ?? 0, data: [] };

  // Filter out invalid pricing_data and add signed URLs
  const validCourses = await Promise.all(
    courses.map(async (course) => {
      const parsed = PricingSchema.safeParse(course.pricing_data);
      if (!parsed.success) {
        console.error(
          `[fetchPublishedCoursesByUser] Invalid pricing_data for course ${course.id}:`,
          parsed.error.format(),
        );
        return null;
      }

      let signedUrl: string | null = null;
      if (course.image_url) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(THUMBNAILS_BUCKET)
          .createSignedUrl(course.image_url, 3600);

        if (signedUrlError) {
          console.error(
            `[fetchPublishedCoursesByUser] Failed to create signed URL for ${course.image_url}:`,
            signedUrlError.message,
          );
        } else {
          signedUrl = signedUrlData?.signedUrl || null;
        }
      }

      return {
        ...course,
        pricing_data: parsed.data,
        signed_url: signedUrl,
      };
    }),
  );

  const filteredCourses = validCourses.filter((c): c is Exclude<typeof c, null> => c !== null);

  return {
    count: filteredCourses.length,
    data: filteredCourses,
  };
}
