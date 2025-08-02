import type { FileType } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET, PUBLISHED_FILE_LIBRARY_BUCKET } from '../constants';

interface FetchFileByIdArgs {
  supabase: TypedSupabaseClient;
  fileId: string;
  expirySeconds?: number;
  mode: 'preview' | 'play';
}

/**
 * Fetches a single file from the file_library table by its ID and generates a signed URL for it.
 *
 * @param args - Object containing supabase client, file ID, optional expiry time, and mode ('preview' or 'play').
 * @returns Promise with an object containing the file data and signed URL or null on error.
 */
export async function fetchFileById({
  supabase,
  fileId,
  expirySeconds = 3600,
  mode,
}: FetchFileByIdArgs) {
  try {
    // Fetch the file metadata from the database
    const { data, error } = await supabase
      .from('file_library')
      .select('id, name, path, file_type, blur_preview')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      console.error('[fetchFileById] Error fetching file_library:', error, 'fileId:', fileId);
      return null;
    }

    const bucket = mode === 'preview' ? FILE_LIBRARY_BUCKET : PUBLISHED_FILE_LIBRARY_BUCKET;

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, expirySeconds);

    if (signedUrlError) {
      console.error('[fetchFileById] Error creating signed URL:', signedUrlError);
      return null;
    }

    return {
      ...data,
      file_type: data.file_type as FileType,
      signed_url: signedUrlData?.signedUrl ?? null,
    };
  } catch (error) {
    console.error('[fetchFileById] Unexpected error:', error);
    return null;
  }
}
