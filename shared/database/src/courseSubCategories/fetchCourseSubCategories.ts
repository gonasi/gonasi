import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

export async function fetchCourseSubCategories({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('course_sub_categories')
    .select()
    .order('created_at', { ascending: false });

  // Apply search filter if searchQuery is provided (search by name only)
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  // Apply pagination range
  query = query.range(startIndex, endIndex);

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return [];
  }

  return data;
}
