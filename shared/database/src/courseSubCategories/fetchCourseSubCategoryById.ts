import type { TypedSupabaseClient } from '../client';

export async function fetchCourseSubCategoryById(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('course_sub_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching pathway:', error?.message || 'Pathway not found');
    return null;
  }

  return data;
}
