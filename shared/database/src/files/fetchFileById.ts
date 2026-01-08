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
          file_type,
          settings
        `,
      )
      .eq('id', fileId)
      .single();

    if (error || !data) {
      console.error(
        `[fetchFileById] Error fetching mode: ${mode}, table: ${table}, File Id: ${fileId}:`,
        error,
      );
      return {
        success: false,
        message: 'File not found or failed to fetch from database',
        data: null,
      };
    }

    const cacheVersion = data.updated_at ? new Date(data.updated_at).getTime() : undefined;

    const isVideo = data.file_type === 'video';
    const isImage = data.file_type === 'image';
    const isSvg =
      isImage && (data.mime_type === 'image/svg+xml' || data.extension?.toLowerCase() === 'svg');

    let signedUrl: string;

    // 🎥 Videos
    if (isVideo) {
      signedUrl = getVideoStreamingUrl(data.path, expirySeconds, cacheVersion);
    }
    // 🖼 Images (SVG-safe)
    else if (isImage) {
      signedUrl = getSignedUrl(data.path, {
        expiresInSeconds: expirySeconds,
        resourceType: 'image',
        version: cacheVersion,
        mimeType: data.mime_type,
        extension: data.extension,
        ...(isSvg
          ? {} // 🔒 SVG: NO transforms, NO format, NO quality
          : {
              format: 'auto',
              quality: 'auto',
            }),
      });
    }
    // 📦 Raw assets (GLB, PDF, ZIP, etc.)
    else {
      signedUrl = getSignedUrl(data.path, {
        expiresInSeconds: expirySeconds,
        resourceType: 'raw',
        version: cacheVersion,
      });
    }

    const blurUrl = isImage && !isSvg ? getBlurPlaceholderUrl(data.path, expirySeconds) : null;

    console.log('🔍 signedUrl:', signedUrl);
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
