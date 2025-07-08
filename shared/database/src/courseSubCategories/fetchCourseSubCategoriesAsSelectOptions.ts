import type { TypedSupabaseClient } from '../client';

export async function fetchCourseSubCategoriesAsSelectOptions(
  supabase: TypedSupabaseClient,
  categoryId?: string,
) {
  const query = supabase.from('course_sub_categories').select('id, name, category_id');

  if (categoryId) {
    query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch course subcategories: ${error.message}`);
  }

  if (!data?.length) {
    return [];
  }

  return data.map(({ id, name, category_id }) => ({
    value: id,
    label: name,
    categoryId: category_id,
  }));
}
