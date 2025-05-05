import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

/**
 * Fetches a paginated list of course categories from the Supabase database.
 * Supports optional search by name or description.
 *
 * @param params - Parameters for fetching data.
 * @param params.supabase - A typed Supabase client instance.
 * @param params.searchQuery - Optional search string to filter by name or description.
 * @param params.limit - Number of items to fetch (default: 10).
 * @param params.page - Offset for pagination (default: 0).
 * @returns An object containing the total count and the fetched data array.
 * @throws Will throw an error if the Supabase query fails.
 */
export async function fetchCourseCategories({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('course_categories')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  // Apply pagination range
  query = query.range(startIndex, endIndex);

  const { error, data, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: data?.length ? count : null,
    data: data ?? [],
  };
}
