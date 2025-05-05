import type { TypedSupabaseClient } from '../client';

/**
 * Fetches a single course category by its ID, including its related subcategories.
 *
 * @param supabase - A typed Supabase client instance.
 * @param id - The ID of the course category to fetch.
 * @returns The course category data with its subcategories, or `null` if not found or an error occurs.
 */
export async function fetchCourseCategoryById(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('course_categories')
    .select('*, course_sub_categories(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching course category:', error?.message || 'Category not found');
    return null;
  }

  return data;
}
