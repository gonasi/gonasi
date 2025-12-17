import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';
import { CourseStructureOverviewSchema } from '@gonasi/schemas/publish/courseStructure';

import type { TypedSupabaseClient } from '../../client';
import { generateSignedThumbnailUrl } from '../../utils';

interface FetchPublishedCourseDetailsArgs {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
}

/**
 * Fetches and transforms a publicly published course by ID.
 * Uses course_structure_overview (no blocks, just structure).
 * Works for both authenticated and anonymous users.
 */
export async function fetchPublishedCourseDetails({
  supabase,
  publishedCourseId,
}: FetchPublishedCourseDetailsArgs) {
  const query = supabase
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
    .eq('id', publishedCourseId)
    .eq('course_enrollments.is_active', true)
    .eq('is_active', true);

  const { data: courseRow, error } = await query.maybeSingle();

  if (error) {
    console.error('[fetchPublishedCourseDetails] Supabase error:', error.message);
    return null;
  }

  if (!courseRow) {
    console.warn(`[fetchPublishedCourseDetails] Course ${publishedCourseId} not found`);
    return null;
  }

  // Use updated_at for cache busting (changes on every republish)
  // Fall back to published_at if updated_at is not available
  const timestampToUse = courseRow.updated_at ?? courseRow.published_at;
  const version = timestampToUse ? new Date(timestampToUse).getTime() : Date.now();

  const signedImageUrl = generateSignedThumbnailUrl({
    imagePath: courseRow.image_url,
    version, // Add version for cache busting
  });

  const pricingParse = PricingSchema.safeParse(courseRow.pricing_tiers);
  if (!pricingParse.success) {
    console.error('[fetchPublishedCourseDetails] Invalid pricing schema:', pricingParse.error);
    return null;
  }

  const structureParse = CourseStructureOverviewSchema.safeParse(
    courseRow.course_structure_overview,
  );

  if (!structureParse.success) {
    console.error(
      '[fetchPublishedCourseDetails] Invalid course structure schema:',
      structureParse.error,
    );
    return null;
  }

  return {
    ...courseRow,
    image_url: signedImageUrl,
    pricing_tiers: pricingParse.data,
    course_structure_overview: structureParse.data,
  };
}
