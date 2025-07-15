import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import { getUserId } from '../auth';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

/**
 * Fetches paginated list of public, published courses
 * that the current user is actively enrolled in.
 */
export async function fetchUsersActivelyEnrolledCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);
  const userId = await getUserId(supabase);

  // Query public and active published courses where the user has an active enrollment
  let query = supabase
    .from('published_courses')
    .select(
      `
      id,
      organization_id,
      course_categories ( name ),
      course_sub_categories ( name ),
      name,
      description,
      image_url,
      blur_hash,
      visibility,
      pricing_tiers,
      published_at,
      published_by,
      total_chapters,
      total_lessons,
      total_blocks,
      has_free_tier,
      min_price,
      total_enrollments,
      active_enrollments,
      completion_rate,
      average_rating,
      total_reviews,
      organizations (
        id,
        name,
        handle,
        avatar_url,
        blur_hash
      ),
      course_enrollments (
        id,
        user_id,
        expires_at,
        is_active
      )
    `,
      { count: 'exact' },
    )
    .eq('course_enrollments.user_id', userId) // Only courses this user is enrolled in
    .eq('course_enrollments.is_active', true) // Only active enrollments
    .order('published_at', { ascending: false })
    .range(startIndex, endIndex);

  // Optional search filter on course name and description
  if (searchQuery) {
    console.log('[fetchUsersActivelyEnrolledCourses] searchQuery:', searchQuery);
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[fetchUsersActivelyEnrolledCourses] Supabase error:', error.message);
    return { count: 0, data: [] };
  }

  console.log('[fetchUsersActivelyEnrolledCourses] Fetched enrolled courses:', data?.length ?? 0);

  // Post-processing: sign image URLs and validate pricing tiers
  const processedCourses = await Promise.all(
    (data ?? []).map(async (course) => {
      const signedImageUrl = await generateSignedThumbnailUrl({
        supabase,
        imagePath: course.image_url,
      });

      const signedAvatarUrl = await generateSignedOrgProfileUrl({
        supabase,
        imagePath: course.organizations?.avatar_url ?? '',
      });

      const { success, data: validatedPricingTiers } = PricingSchema.safeParse(
        course.pricing_tiers,
      );

      if (!success) {
        console.warn(
          '[fetchUsersActivelyEnrolledCourses] Invalid pricing schema for course:',
          course.id,
        );
      }

      return {
        ...course,
        image_url: signedImageUrl,
        pricing_tiers: success ? validatedPricingTiers : [],
        organizations: {
          ...course.organizations,
          avatar_url: signedAvatarUrl,
        },
      };
    }),
  );

  console.log('[fetchUsersActivelyEnrolledCourses] Returning processed enrolled course data');

  return {
    count: count || 0,
    data: processedCourses,
  };
}
