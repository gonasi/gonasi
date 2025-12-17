import { getSignedUrl } from '@gonasi/cloudinary';

import { getUserId } from '../auth';
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
export async function fetchUserCoursesAsSelectOptions(
  supabase: TypedSupabaseClient,
  pathwayId: string,
): Promise<{ value: string; label: string; imageUrl?: string }[]> {
  const userId = await getUserId(supabase);

  // Use OR filter to handle both non-matching AND null pathway_ids
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, image_url, pathway_id, updated_at')
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
    data.map(async (course) => {
      if (!course.image_url) return { value: course.id, label: course.name, imageUrl: undefined };

      try {
        // Use updated_at timestamp as cache-busting version parameter
        const version = course.updated_at ? new Date(course.updated_at).getTime() : undefined;

        const signedUrl = getSignedUrl(course.image_url, {
          width: 200,
          quality: 'auto',
          format: 'auto',
          expiresInSeconds: 3600,
          resourceType: 'image',
          crop: 'fill',
          version, // Add version for cache busting
        });

        return { value: course.id, label: course.name, imageUrl: signedUrl };
      } catch (error) {
        console.error('[fetchUserCoursesAsSelectOptions] Failed to generate signed URL:', error);
        return { value: course.id, label: course.name, imageUrl: undefined };
      }
    }),
  );
}
