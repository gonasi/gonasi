import type { TypedSupabaseClient } from '../client';

/**
 * Fetches course subcategories from the database and formats them as select options.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @returns {Promise<Array<{ value: string; label: string; categoryId: string }>>}
 * A promise resolving to an array of select options with an optional category ID.
 * @throws {Error} If there is an issue retrieving data from the database.
 */
export async function fetchCourseSubCategoriesAsSelectOptions(
  supabase: TypedSupabaseClient,
): Promise<{ value: string; label: string; categoryId: string }[]> {
  const { data, error } = await supabase
    .from('course_sub_categories')
    .select('id, name, category_id');

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
