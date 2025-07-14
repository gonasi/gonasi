import type { TypedSupabaseClient } from '../client';

interface GetCategoryNameArgs {
  supabase: TypedSupabaseClient;
  id: string;
}

/**
 * Fetches the name of a category by its ID.
 *
 * @returns The category name or an empty string if not found or error occurs.
 */
export async function getCategoryName({ supabase, id }: GetCategoryNameArgs): Promise<string> {
  const { data, error } = await supabase
    .from('course_categories')
    .select('name')
    .eq('id', id)
    .single();

  if (error || !data?.name) {
    console.error('Error fetching category name:', error?.message || 'Not found');
    return '';
  }

  return data.name;
}
