import { getUserIdFromUsername } from '../auth';
import { COURSES_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchAssetsParams } from '../types';

interface FetchCoursesByAdmin extends FetchAssetsParams {
  username: string;
}

export async function fetchCoursesForOwnerOrCollaborators({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  username,
}: FetchCoursesByAdmin) {
  const userId = await getUserIdFromUsername(supabase, username);
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('courses')
    .select('id, name, image_url, blur_hash', { count: 'exact' })
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex);

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: courses, error, count } = await query;

  if (error) throw new Error(error.message);
  if (!courses || courses.length === 0) return { count: 0, data: [] };

  const dataWithSignedUrls = await Promise.all(
    courses.map(async (course) => {
      if (!course.image_url) return { ...course, signed_url: null };

      const { data } = supabase.storage
        .from(COURSES_BUCKET)
        .getPublicUrl(`${userId}/${course.image_url}`);

      return {
        ...course,
        signed_url: data?.publicUrl ?? null,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
