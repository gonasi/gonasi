import { THUMBNAILS_BUCKET } from '../../constants';
import { getPaginationRange } from '../../constants/utils';
import type { FetchAssetsParams } from '../../types';

export async function fetchAllPublishedCoursesWithSignedUrl({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchAssetsParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('courses')
    .select(
      `
        id, name, description, image_url, monthly_subscription_price, status, created_at, updated_at, 
        created_by, updated_by, course_categories(id, name), course_sub_categories(id, name),
        pathways(id, name), lessons(id, name, created_at), chapters(id, name),
        created_by_profile:profiles!courses_created_by_fkey (id, username, email, full_name, avatar_url)
      `,
      { count: 'exact' },
    )
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  // Apply pagination range
  query = query.range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  if (!data?.length) return { count: 0, data: [] };

  const userCourses = await Promise.all(
    data.map(async (course) => {
      const chapters_count = course.chapters?.length || 0;
      const lesson_count = course.lessons?.length || 0;

      if (!course.image_url) return { ...course, lesson_count, chapters_count, signed_url: null };

      const { data: signedUrlData, error: fileError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .createSignedUrl(course.image_url, 3600);

      if (fileError) throw new Error(fileError.message);

      return {
        ...course,
        lesson_count,
        chapters_count,
        signed_url: signedUrlData.signedUrl,
      };
    }),
  );

  return { count, data: userCourses };
}
