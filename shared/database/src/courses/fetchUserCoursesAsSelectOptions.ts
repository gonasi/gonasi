import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { COURSES_BUCKET } from '../constants';

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
export async function fetchUserCoursesAsSelectOptions(
  supabase: TypedSupabaseClient,
  pathwayId: string,
): Promise<{ value: string; label: string; imageUrl?: string }[]> {
  const userId = await getUserId(supabase);

  // Use OR filter to handle both non-matching AND null pathway_ids
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, image_url, pathway_id')
    .eq('created_by', userId)
    .or(`pathway_id.neq.${pathwayId},pathway_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch courses: ${error.message}`);
  }

  if (!data?.length) {
    return [];
  }

  return await Promise.all(
    data.map(async ({ id, name, image_url }) => {
      if (!image_url) return { value: id, label: name, imageUrl: undefined };

      const { data: signedUrlData, error: fileError } = await supabase.storage
        .from(COURSES_BUCKET)
        .createSignedUrl(image_url, 3600);

      if (fileError) {
        throw new Error(`Failed to generate signed URL for ${image_url}: ${fileError.message}`);
      }

      return { value: id, label: name, imageUrl: signedUrlData.signedUrl };
    }),
  );
}
