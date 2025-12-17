import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import { getUserId } from '../auth';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

// Type for course enrollment data
interface CourseEnrollment {
  id: string;
  published_course_id: string;
  user_id: string;
  expires_at: string | null;
  is_active: boolean;
}

/**
 * Fetches paginated list of publicly visible, active published courses
 * with enrollment status for the current user.
 */
export async function fetchPublishedPublicCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);
  const userId = await getUserId(supabase);

  // Base query to fetch published courses with related org, category info
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
      updated_at,
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
      )
    `,
      { count: 'exact' },
    )
    .eq('visibility', 'public') // Only public courses
    .eq('is_active', true) // Only active courses
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

  // If user is logged in, fetch their enrollment data separately
  let enrollmentMap = new Map<string, CourseEnrollment>();
  if (userId && data?.length) {
    const courseIds = data.map((course) => course.id);
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('id, published_course_id, user_id, expires_at, is_active')
      .eq('user_id', userId)
      .in('published_course_id', courseIds);

    if (enrollments) {
      enrollmentMap = new Map(
        enrollments.map((enrollment) => [
          enrollment.published_course_id,
          enrollment as CourseEnrollment,
        ]),
      );
    }
  }

  // Process results: sign image URLs and validate pricing tiers
  const processedCourses = await Promise.all(
    (data ?? []).map(async (course) => {
      // Use updated_at for cache busting (changes on every republish)
      // Fall back to published_at if updated_at is not available
      const timestampToUse = course.updated_at ?? course.published_at;
      const version = timestampToUse ? new Date(timestampToUse).getTime() : Date.now();

      const signedImageUrl = generateSignedThumbnailUrl({
        imagePath: course.image_url,
        version, // Add version for cache busting
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
        // Add enrollment data if user is logged in
        enrollment: userId ? enrollmentMap.get(course.id) || null : null,
      };
    }),
  );

  return {
    count: count || 0,
    data: processedCourses,
  };
}
