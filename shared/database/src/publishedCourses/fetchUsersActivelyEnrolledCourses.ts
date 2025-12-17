import { getUserIdFromUsername } from '../auth';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

/**
 * Fetches paginated list of public, published courses
 * that the given user is actively enrolled in.
 */
export async function fetchUsersActivelyEnrolledCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  username,
}: FetchDataParams & { username: string }) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  const userId = await getUserIdFromUsername(supabase, username);

  let enrollmentQuery = supabase
    .from('course_enrollments')
    .select(
      `
      id,
      user_id,
      enrolled_at,
      expires_at,
      completed_at,
      published_courses (
        id,
        name,
        description,
        image_url,
        blur_hash,
        visibility,
        organizations (
          id,
          name,
          handle,
          avatar_url,
          blur_hash
        )
      )
    `,
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })
    .range(startIndex, endIndex);

  if (searchQuery) {
    enrollmentQuery = enrollmentQuery.or(
      `published_courses.name.ilike.%${searchQuery}%,published_courses.description.ilike.%${searchQuery}%`,
    );
  }

  const { data, error, count } = await enrollmentQuery;

  if (error) {
    console.error('[fetchUsersActivelyEnrolledCourses] Supabase error:', error.message);
    return { count: 0, data: [] };
  }

  if (!data?.length) {
    return { count: 0, data: [] };
  }

  const processedCourses = await Promise.all(
    data.map(async ({ id: enrollment_id, expires_at, published_courses }) => {
      if (!published_courses) return null;

      const [signedImageUrl, signedAvatarUrl] = await Promise.all([
        generateSignedThumbnailUrl({
          imagePath: published_courses.image_url,
        }),
        generateSignedOrgProfileUrl({
          supabase,
          imagePath: published_courses.organizations?.avatar_url ?? '',
        }),
      ]);

      return {
        ...published_courses,
        image_url: signedImageUrl,
        organizations: {
          ...published_courses.organizations,
          avatar_url: signedAvatarUrl,
        },
        enrollment_id,
        enrollment_expires_at: expires_at,
      };
    }),
  );

  return {
    count: count || 0,
    data: processedCourses.filter(Boolean),
  };
}
