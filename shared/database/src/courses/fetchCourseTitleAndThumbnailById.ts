import { getBlurPlaceholderUrl, getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

interface FetchCourseThumbnailArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

export async function fetchCourseTitleAndThumbnailById({
  supabase,
  courseId,
}: FetchCourseThumbnailArgs) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      name,
      image_url,
      blur_hash,
      updated_at
    `,
    )
    .eq('id', courseId)
    .single();

  if (error || !data) {
    console.error('[fetchCourseTitleAndThumbnailById] Error:', error?.message);
    return null;
  }

  if (!data.image_url) {
    return {
      id: data.id,
      name: data.name,
      signedUrl: null,
      blurUrl: null,
    };
  }

  try {
    const version = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();

    const signedUrl = getSignedUrl(data.image_url, {
      width: 800,
      quality: 'auto',
      format: 'auto',
      crop: 'fill',
      resourceType: 'image',
      expiresInSeconds: 3600,
      version,
    });

    const blurUrl = getBlurPlaceholderUrl(data.image_url, 3600);

    return {
      id: data.id,
      name: data.name,
      signedUrl,
      blurUrl,
    };
  } catch (err) {
    console.error('[fetchCourseTitleAndThumbnailById] Failed to generate URLs:', err);

    return {
      id: data.id,
      name: data.name,
      signedUrl: null,
      blurUrl: null,
    };
  }
}
