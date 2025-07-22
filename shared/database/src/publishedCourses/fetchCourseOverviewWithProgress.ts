import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';
import { CourseStructureOverviewSchema } from '@gonasi/schemas/publish/courseStructure';

import type { TypedSupabaseClient } from '../client';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

interface FetchCourseOverviewWithProgressArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

/**
 * Fetches a public published course overview using the `get_course_progress_overview` RPC.
 * Includes user-specific progress if the user is enrolled.
 * Works for both authenticated and anonymous users.
 */
export async function fetchCourseOverviewWithProgress({
  supabase,
  courseId,
}: FetchCourseOverviewWithProgressArgs) {
  const { data, error } = await supabase.rpc('get_course_progress_overview', {
    p_published_course_id: courseId,
  });

  if (error) {
    console.error('[fetchCourseOverviewWithProgress] Supabase RPC error:', error.message);
    return null;
  }

  if (!data) {
    console.warn(`[fetchCourseOverviewWithProgress] Course ${courseId} not found`);
    return null;
  }

  console.log('****** data is: ', data);
  const { course, chapters, overall_progress, recent_activity, statistics } = data;

  const signedImageUrl = await generateSignedThumbnailUrl({
    supabase,
    imagePath: course.image_url,
  });

  const signedOrgAvatarUrl = await generateSignedOrgProfileUrl({
    supabase,
    imagePath: course.organizations?.avatar_url ?? '',
  });

  // Validate pricing tiers
  const pricingParse = PricingSchema.safeParse(course.pricing_tiers);
  if (!pricingParse.success) {
    console.error('[fetchCourseOverviewWithProgress] Invalid pricing schema:', pricingParse.error);
    return null;
  }

  // Validate course structure overview
  const structureParse = CourseStructureOverviewSchema.safeParse(data.course_structure_overview);
  if (!structureParse.success) {
    console.error(
      '[fetchCourseOverviewWithProgress] Invalid structure schema:',
      structureParse.error,
    );
    return null;
  }

  return {
    ...course,
    image_url: signedImageUrl,
    avatar_url: signedOrgAvatarUrl,
    pricing_tiers: pricingParse.data,
    course_structure_overview: structureParse.data,
    overall_progress,
    chapters,
    recent_activity,
    statistics,
  };
}
