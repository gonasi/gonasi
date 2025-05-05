import { mapDataToOptions } from '@gonasi/utils/mapDataToOptions';

import type { TypedSupabaseClient } from '../client';

/**
 * Retrieves course categories from the database and maps them into
 * an array of options suitable for select inputs.
 *
 * Each option includes:
 * - `value`: the course category ID
 * - `label`: the course category name
 *
 * @param supabase - An instance of the Supabase client.
 * @returns A promise resolving to an array of select options.
 * @throws Will throw an error if the course categories cannot be fetched.
 */
export async function fetchCourseCategoriesAsSelectOptions(
  supabase: TypedSupabaseClient,
): Promise<{ value: string; label: string; imageUrl?: string }[]> {
  const { data, error } = await supabase.from('course_categories').select('id, name');

  if (error) {
    throw new Error(`Unable to fetch course categories: ${error.message}`);
  }

  if (!data?.length) {
    return [];
  }

  return mapDataToOptions(data, 'id', 'name');
}
