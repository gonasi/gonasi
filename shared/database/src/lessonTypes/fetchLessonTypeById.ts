import type { TypedSupabaseClient } from '../client';

/**
 * Fetches a single lesson type by its ID.
 *
 * @param supabase - A typed Supabase client instance.
 * @param id - The ID of the lesson type to fetch.
 * @returns The lesson type data, or `null` if not found or an error occurs.
 */
export async function fetchLessonTypeById(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase.from('lesson_types').select('*').eq('id', id).single();

  if (error || !data) {
    console.error('Error fetching lesson type:', error?.message || 'Lesson type not found');
    return null;
  }

  return data;
}
