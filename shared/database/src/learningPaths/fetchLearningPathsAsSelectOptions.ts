import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { LEARNING_PATHWAYS_BUCKET } from '../constants';

/**
 * Retrieves learning pathways created by a specific user and formats them as select options.
 * Each option includes an ID, name, and a signed image URL if available.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} userId - The ID of the user whose learning pathways are being fetched.
 * @returns {Promise<Array<{ value: string; label: string; imageUrl?: string }>>}
 * A promise that resolves to an array of select options.
 * @throws {Error} If data retrieval or signed URL generation fails.
 */
export async function fetchLearningPathsAsSelectOptions(supabase: TypedSupabaseClient) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('pathways')
    .select('id, name, image_url')
    .eq('created_by', userId);

  if (error) {
    throw new Error(`Failed to fetch learning paths: ${error.message}`);
  }

  if (!data?.length) {
    return [];
  }

  return await Promise.all(
    data.map(async ({ id, name, image_url }) => {
      if (!image_url) return { value: id, label: name, imageUrl: undefined };

      const { data: signedUrlData, error: fileError } = await supabase.storage
        .from(LEARNING_PATHWAYS_BUCKET)
        .createSignedUrl(image_url, 3600);

      if (fileError) {
        throw new Error(`Failed to generate signed URL for ${image_url}: ${fileError.message}`);
      }

      return { value: id, label: name, imageUrl: signedUrlData.signedUrl };
    }),
  );
}
