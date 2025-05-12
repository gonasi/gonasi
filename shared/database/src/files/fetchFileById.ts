import type { FileType } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET } from '../constants';

/**
 * Fetches a single file from the file_library table by its ID and generates a signed URL for it.
 *
 * @param supabase - Supabase client instance.
 * @param fileId - The unique identifier of the file to fetch.
 * @param expirySeconds - How long the signed URL should be valid for (in seconds). Default is 3600 (1 hour).
 * @returns Promise with an object containing the file data with a signed URL or an error message.
 */
export async function fetchFileById(
  supabase: TypedSupabaseClient,
  fileId: string,
  expirySeconds = 3600,
) {
  try {
    // Fetch the file metadata from the database
    const { data, error } = await supabase
      .from('file_library')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      console.error('Error fetching file_library: ', error);
      return null;
    }

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(FILE_LIBRARY_BUCKET)
      .createSignedUrl(data.path, expirySeconds);

    if (signedUrlError) {
      console.error('Error signed url: ', signedUrlError);
      return null;
    }

    // Return the file data with the signed URL
    return {
      ...data,
      file_type: data.file_type as FileType,
      signed_url: signedUrlData?.signedUrl ?? null,
    };
  } catch (error) {
    console.error('Unexpected error during file fetch:', error);
    return null;
  }
}
