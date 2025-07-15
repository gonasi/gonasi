import { CourseStructureSchema } from '@gonasi/schemas/publish';
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
 * Removes lesson.blocks from course_structure (for non-paid users).
 */
export async function fetchPublishedPublicCourseById({
  supabase,
  courseId,
}: FetchPublishedPublicCourseByIdArgs) {
  const userId = await getUserId(supabase);

  const { data: courseRow, error } = await supabase
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
    course_structure,
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
    .eq('is_active', true)
    .filter('course_enrollments.user_id', 'eq', userId)
    .maybeSingle();

  if (error) {
    console.error('[fetchPublishedPublicCourseById] Supabase error:', error.message);
    return null;
  }

  if (!courseRow) {
    console.warn(`[fetchPublishedPublicCourseById] Course ${courseId} not found`);
    return null;
  }

  console.log('[fetchPublishedPublicCourseById] Found course:', courseRow.name);

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

  const structureParse = CourseStructureSchema.safeParse(courseRow.course_structure);
  if (!structureParse.success) {
    console.error(
      '[fetchPublishedPublicCourseById] Invalid course structure schema:',
      structureParse.error,
    );
    return null;
  }

  const validatedPricingTiers = pricingParse.data;
  const validatedCourseStructure = structureParse.data;

  const courseStructureWithoutBlocks = {
    ...validatedCourseStructure,
    chapters: validatedCourseStructure.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        const { blocks: _blocks, ...rest } = lesson;
        return rest;
      }),
    })),
  };

  console.log('[fetchPublishedPublicCourseById] Returning processed course data');

  return {
    ...courseRow,
    image_url: signedImageUrl,
    pricing_tiers: validatedPricingTiers,
    course_structure: courseStructureWithoutBlocks,
    organizations: {
      ...courseRow.organizations,
      avatar_url: signedAvatarUrl,
    },
  };
}
