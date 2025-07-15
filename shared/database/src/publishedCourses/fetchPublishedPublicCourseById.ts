import { CourseStructureOverviewSchema } from '@gonasi/schemas/publish';
import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

interface FetchPublishedPublicCourseByIdArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

/**
 * Fetches and transforms a publicly published course by ID.
 * Uses course_structure_overview (no blocks, just structure).
 * Works for both authenticated and anonymous users.
 */
export async function fetchPublishedPublicCourseById({
  supabase,
  courseId,
}: FetchPublishedPublicCourseByIdArgs) {
  const userId = await getUserId(supabase);

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
      is_active,
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
      course_structure_overview,
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
    )
    .eq('id', courseId)
    .eq('visibility', 'public')
    .eq('is_active', true);

  if (userId) {
    query = query.filter('course_enrollments.user_id', 'eq', userId);
  }

  const { data: courseRow, error } = await query.maybeSingle();

  if (error) {
    console.error('[fetchPublishedPublicCourseById] Supabase error:', error.message);
    return null;
  }

  if (!courseRow) {
    console.warn(`[fetchPublishedPublicCourseById] Course ${courseId} not found`);
    return null;
  }

  const signedImageUrl = await generateSignedThumbnailUrl({
    supabase,
    imagePath: courseRow.image_url,
  });

  const signedAvatarUrl = await generateSignedOrgProfileUrl({
    supabase,
    imagePath: courseRow.organizations?.avatar_url ?? '',
  });

  const pricingParse = PricingSchema.safeParse(courseRow.pricing_tiers);
  if (!pricingParse.success) {
    console.error('[fetchPublishedPublicCourseById] Invalid pricing schema:', pricingParse.error);
    return null;
  }

  // Use CourseStructureOverviewSchema instead of CourseStructureContentSchema
  const structureParse = CourseStructureOverviewSchema.safeParse(
    courseRow.course_structure_overview,
  );

  if (!structureParse.success) {
    console.error(
      '[fetchPublishedPublicCourseById] Invalid course structure schema:',
      structureParse.error,
    );
    return null;
  }

  return {
    ...courseRow,
    image_url: signedImageUrl,
    pricing_tiers: pricingParse.data,
    course_structure: structureParse.data,
    organizations: {
      ...courseRow.organizations,
      avatar_url: signedAvatarUrl,
    },
  };
}
