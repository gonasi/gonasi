import type { z } from 'zod';

import { PublishOverviewCourseProgressOverviewSchema } from '@gonasi/schemas/publish/course-overview-with-progress';

import type { TypedSupabaseClient } from '../client';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

// Derive types from schema
type CourseProgressOverview = z.infer<typeof PublishOverviewCourseProgressOverviewSchema>;

/**
 * Args for fetching a published course with user-specific progress
 */
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
}: FetchCourseOverviewWithProgressArgs): Promise<CourseProgressOverview | null> {
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

  const parsed = PublishOverviewCourseProgressOverviewSchema.safeParse(data);

  if (!parsed.success) {
    console.error(
      '[fetchCourseOverviewWithProgress] Invalid response schema:',
      JSON.stringify(parsed.error, null, 4),
    );
    return null;
  }

  const parsedData = parsed.data;
  const { course, organization } = parsedData;

  const signedImageUrl = await generateSignedThumbnailUrl({
    supabase,
    imagePath: course.image_url,
  });

  const signedOrgAvatarUrl = await generateSignedOrgProfileUrl({
    supabase,
    imagePath: organization.avatar_url ?? '',
  });

  return {
    ...parsedData,
    course: {
      ...course,
      image_url: signedImageUrl ?? '',
    },
    organization: {
      ...organization,
      avatar_url: signedOrgAvatarUrl ?? '',
    },
  };
}
