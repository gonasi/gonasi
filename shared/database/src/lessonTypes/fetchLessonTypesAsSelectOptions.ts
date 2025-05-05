import type { TypedSupabaseClient } from '../client';

/**
 * Fetches lesson types from the database and maps them into
 * an array of select options.
 *
 * Each option contains:
 * - `value`: The lesson type ID.
 * - `label`: The lesson type name.
 * - `description`: The lesson type description.
 *
 * @param supabase - A typed Supabase client instance.
 * @returns A promise that resolves to an array of select options.
 * @throws Throws an error if the lesson types cannot be fetched.
 */
export async function fetchLessonTypesAsSelectOptions(
  supabase: TypedSupabaseClient,
): Promise<{ value: string; label: string; description: string }[]> {
  const { data, error } = await supabase.from('lesson_types').select('id, name, description');

  if (error) {
    throw new Error(`Unable to fetch lesson types: ${error.message}`);
  }

  if (!data?.length) {
    return [];
  }

  return data.map((lessonType) => ({
    value: lessonType.id,
    label: lessonType.name,
    description: lessonType.description,
  }));
}
