import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

interface FetchSubCategoriesParams extends FetchDataParams {
  courseCategoryId: string;
}

export async function fetchCourseSubCategoryByCategoryId({
  supabase,
  searchQuery,
  limit = 12,
  page = 1,
  courseCategoryId,
}: FetchSubCategoriesParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('course_sub_categories')
    .select()
    .eq('category_id', courseCategoryId)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  // Apply pagination range
  query = query.range(startIndex, endIndex);

  const { error, data } = await query;

  if (error || !data) {
    console.error('Error fetching pathway:', error?.message || 'Pathway not found');
    return [];
  }

  return data;
}
