import { getUserId } from '../auth';
import { LEARNING_PATHWAYS_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

export async function fetchLearningPathsWithSignedUrls({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams) {
  const userId = await getUserId(supabase);
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('pathways')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .eq('created_by', userId);

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  query = query.range(startIndex, endIndex);

  const { error, data, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length || !count) {
    return {
      count: null,
      data: [],
    };
  }

  const learningPathways = await Promise.all(
    data.map(async (pathway) => {
      const { data: signedUrlData, error: fileError } = await supabase.storage
        .from(LEARNING_PATHWAYS_BUCKET)
        .createSignedUrl(pathway.image_url, 3600);

      if (fileError) {
        throw new Error(fileError.message);
      }

      const { count: courseCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact' })
        .eq('pathway_id', pathway.id);

      return {
        ...pathway,
        course_count: courseCount,
        signed_url: signedUrlData?.signedUrl,
      };
    }),
  );

  return {
    count,
    data: learningPathways,
  };
}
