import type { TypedSupabaseClient } from '../client';

interface GetSubCategoryNameArgs {
  supabase: TypedSupabaseClient;
  id: string;
}

/**
 * Fetches the name of a subcategory by its ID.
 *
 * @returns The subcategory name or an empty string if not found or error occurs.
 */
export async function getSubCategoryName({
  supabase,
  id,
}: GetSubCategoryNameArgs): Promise<string> {
  const { data, error } = await supabase
    .from('course_sub_categories')
    .select('name')
    .eq('id', id)
    .single();

  if (error || !data?.name) {
    console.error('Error fetching subcategory name:', error?.message || 'Not found');
    return '';
  }

  return data.name;
}
