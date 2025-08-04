import type { FileType } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';
import { FILE_LIBRARY_BUCKET, PUBLISHED_FILE_LIBRARY_BUCKET } from '../constants';

interface FetchFileByIdArgs {
  supabase: TypedSupabaseClient;
  fileId: string;
  expirySeconds?: number;
  mode?: 'preview' | 'play';
}

export async function fetchFileById({
  supabase,
  fileId,
  expirySeconds = 3600,
  mode = 'preview',
}: FetchFileByIdArgs) {
  try {
    const { data, error } = await supabase
      .from('file_library')
      .select(
        `
          id,
          created_by,
          updated_by,
          name,
          size,
          path,
          mime_type,
          extension,
          created_at,
          updated_at,
          course_id,
          organization_id,
          blur_preview,
          file_type
        `,
      )
      .eq('id', fileId)
      .single();

    if (error || !data) {
      console.error('[fetchFileById] Error fetching file_library:', error, 'fileId:', fileId);
      return {
        success: false,
        message: 'File not found or failed to fetch from database',
        data: null,
      };
    }

    const bucket = mode === 'preview' ? FILE_LIBRARY_BUCKET : PUBLISHED_FILE_LIBRARY_BUCKET;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, expirySeconds);

    if (signedUrlError) {
      console.error('[fetchFileById] Error creating signed URL:', signedUrlError);
      return {
        success: false,
        message: 'Failed to generate signed URL',
        data: null,
      };
    }

    return {
      success: true,
      message: 'File fetched successfully',
      data: {
        ...data,
        file_type: data.file_type as FileType,
        signed_url: signedUrlData?.signedUrl ?? null,
      },
    };
  } catch (error) {
    console.error('[fetchFileById] Unexpected error:', error);
    return {
      success: false,
      message: 'Unexpected error occurred',
      data: null,
    };
  }
}

export type FetchFileByIdReturn = Awaited<ReturnType<typeof fetchFileById>>['data'];
