import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import { getUserId } from '../auth';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

/**
 * Fetches paginated list of publicly visible, active published courses
 * that the current user is enrolled in.
 */
export async function fetchPublishedPublicCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);
  const userId = await getUserId(supabase);

  // Base query to fetch published courses with related org, category, and enrollment info
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
    .eq('visibility', 'public') // Only public courses
    .eq('is_active', true) // Only active courses
    .eq('course_enrollments.user_id', userId) // Only enrolled courses for current user
    .order('published_at', { ascending: false })
    .range(startIndex, endIndex);

  // Optional full-text search
  if (searchQuery) {
    console.log('[fetchPublishedPublicCourses] searchQuery:', searchQuery);
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[fetchPublishedPublicCourses] Supabase error:', error.message);
    return { count: 0, data: [] };
  }

  console.log('[fetchPublishedPublicCourses] Fetched courses:', data?.length ?? 0);

  // Process results: sign image URLs and validate pricing tiers
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
        console.warn('[fetchPublishedPublicCourses] Invalid pricing schema for course:', course.id);
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

  console.log('[fetchPublishedPublicCourses] Returning processed data');

  return {
    count: count || 0,
    data: processedCourses,
  };
}
