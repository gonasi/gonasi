import { getBlurPlaceholderUrl, getSignedUrl, getVideoStreamingUrl } from '@gonasi/cloudinary';
import type { FileType } from '@gonasi/schemas/file';

import type { TypedSupabaseClient } from '../client';

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
  mode = 'play',
}: FetchFileByIdArgs) {
  try {
    const isPreview = mode === 'preview';
    const table = isPreview ? 'file_library' : 'published_file_library';

    const { data, error } = await supabase
      .from(table)
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
      console.error(
        `[fetchFileById] Error fetching mode: ${mode}, table: ${table}, File Id: ${fileId}:`,
        error,
        'fileId:',
        fileId,
      );
      return {
        success: false,
        message: 'File not found or failed to fetch from database',
        data: null,
      };
    }

    // Generate Cloudinary signed URL
    const resourceType =
      data.file_type === 'video' ? 'video' : data.file_type === 'image' ? 'image' : 'raw';

    const isVideo = data.file_type === 'video';
    const signedUrl = isVideo
      ? getVideoStreamingUrl(data.path, expirySeconds)
      : getSignedUrl(data.path, {
          quality: 'auto',
          format: 'auto',
          expiresInSeconds: expirySeconds,
          resourceType,
        });

    // Generate blur placeholder URL for images (for progressive loading)
    const blurUrl = data.file_type === 'image' ? getBlurPlaceholderUrl(data.path, expirySeconds) : null;

    return {
      success: true,
      message: 'File fetched successfully',
      data: {
        ...data,
        file_type: data.file_type as FileType,
        signed_url: signedUrl,
        blur_url: blurUrl,
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
