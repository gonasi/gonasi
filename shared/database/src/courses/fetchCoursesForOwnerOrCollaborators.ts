import { getUserIdFromUsername } from '../auth';
import { THUMBNAILS_BUCKET } from '../constants';
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

  if (error) {
    console.error('Error fetchCoursesForOwnerOrCollaborators: ', error);
    return {
      count: 0,
      data: [{ signed_url: null, id: '', name: '', image_url: null, blur_hash: null }],
    };
  }
  if (!courses?.length) return { count: 0, data: [] };

  const dataWithSignedUrls = await Promise.all(
    courses.map(async (course) => {
      if (!course.image_url) return { ...course, signed_url: null };

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .createSignedUrl(course.image_url, 3600);

      if (signedUrlError) {
        console.error(
          `Failed to create signed URL for ${course.image_url}:`,
          signedUrlError.message,
        );
      }

      return {
        ...course,
        signed_url: signedUrlData?.signedUrl || null,
      };
    }),
  );

  return { count, data: dataWithSignedUrls };
}
